import json
import os
import shutil
import subprocess
import tempfile
import textwrap
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SummaryHarnessCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.target = Path(self.temp_dir.name)
        shutil.copytree(ROOT / "scripts" / "ai", self.target / "scripts" / "ai")
        shutil.copytree(ROOT / "shared", self.target / "shared")
        (self.target / "scripts" / "coord").mkdir(parents=True, exist_ok=True)
        (self.target / "scripts" / "local-runtime").mkdir(parents=True, exist_ok=True)
        (self.target / "scripts" / "fake").mkdir(parents=True, exist_ok=True)
        (self.target / "output" / "ai").mkdir(parents=True, exist_ok=True)
        (self.target / "package.json").write_text(
            json.dumps(
                {
                    "name": "summary-harness-test",
                    "private": True,
                    "scripts": {
                        "validate:static": "node scripts/fake/validate-static.js",
                        "validate:build": "node scripts/fake/validate-build.js",
                    },
                },
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf8",
        )

        self.write_stub(
            "scripts/coord/preflight.ts",
            """
            const { recordShortcutOpportunityFromEnv } = require("../ai/lib/command-gain.ts");
            const taskArg = process.argv.find((arg) => arg.startsWith("--taskId="));
            const taskId = taskArg ? taskArg.split("=")[1] : null;
            recordShortcutOpportunityFromEnv(process.cwd(), {
              shortcutId: "preflight_summary",
              originalCmd: taskId ? `pnpm preflight -- --taskId=${taskId}` : "pnpm preflight",
              taskId,
              profileId: "preflight_summary",
              profileVersion: "1",
            });
            console.log(JSON.stringify({
              ok: true,
              guard_level: taskId ? "task" : "basic",
              change_class: "light",
              blockers: [],
              retro_hints: [],
              reason: "基础 preflight 已通过。"
            }, null, 2));
            """,
        )
        self.write_stub(
            "scripts/coord/review.ts",
            """
            const { recordShortcutOpportunityFromEnv } = require("../ai/lib/command-gain.ts");
            const taskArg = process.argv.find((arg) => arg.startsWith("--taskId="));
            const taskId = taskArg ? taskArg.split("=")[1] : null;
            recordShortcutOpportunityFromEnv(process.cwd(), {
              shortcutId: "review_summary",
              originalCmd: taskId ? `pnpm coord:review:run -- --taskId=${taskId}` : "pnpm coord:review:run",
              taskId,
              profileId: "review_summary",
              profileVersion: "1",
            });
            console.log(JSON.stringify({
              ok: false,
              task_id: taskId,
              reviewers: [
                { name: "scope_reviewer", pass: false, scope_summary: "范围越界" },
                { name: "test_reviewer", pass: true, test_status: "passed" }
              ],
              merge_decision: "block_and_retry",
              merge_decision_explanation: "scope_reviewer failed"
            }, null, 2));
            process.exit(1);
            """,
        )
        self.write_stub(
            "scripts/local-runtime/check-preview.ts",
            """
            const { recordShortcutOpportunityFromEnv } = require("../ai/lib/command-gain.ts");
            recordShortcutOpportunityFromEnv(process.cwd(), {
              shortcutId: "preview_summary",
              originalCmd: "pnpm preview:check",
              profileId: "preview_summary",
              profileVersion: "1",
            });
            console.log(JSON.stringify({
              ok: true,
              status: { profile: "dev", status: "running", port: 3011, drift: false, reason: "dev 预览健康。" },
              check: { ok: true, reason: "HTTP 200" },
              message: "preview 健康检查通过。"
            }, null, 2));
            """,
        )
        self.write_stub(
            "scripts/local-runtime/check-prod.ts",
            """
            const { recordShortcutOpportunityFromEnv } = require("../ai/lib/command-gain.ts");
            recordShortcutOpportunityFromEnv(process.cwd(), {
              shortcutId: "prod_summary",
              originalCmd: "pnpm prod:check",
              profileId: "prod_summary",
              profileVersion: "1",
            });
            console.log(JSON.stringify({
              ok: false,
              status: { profile: "prod", status: "stopped", port: 3010, drift: true, reason: "production 未启动。" },
              check: { ok: false, reason: "connection refused" },
              message: "production 健康检查失败。"
            }, null, 2));
            process.exit(1);
            """,
        )
        self.write_stub(
            "scripts/fake/validate-static.js",
            """
            console.error("scope: 范围越界");
            console.error("scope: 范围越界");
            console.error("lint.ts:12 error Missing semicolon");
            console.error("lint.ts:15 error Missing semicolon");
            process.exit(1);
            """,
        )
        self.write_stub(
            "scripts/fake/validate-build.js",
            """
            console.log("tests passed");
            console.log("build passed");
            console.log("audit passed");
            """,
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def write_stub(self, relative_path: str, source: str) -> None:
        target = self.target / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(textwrap.dedent(source).strip() + "\n", encoding="utf8")

    def run_script(self, relative_script: str, *args: str) -> subprocess.CompletedProcess[str]:
        env = os.environ.copy()
        env["COMPOUNDING_SUMMARY_DISABLE_TRACKING"] = "0"
        return subprocess.run(
            ["node", "--experimental-strip-types", str(self.target / relative_script), *args],
            cwd=self.target,
            capture_output=True,
            text=True,
            env=env,
        )

    def run_node(self, source: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["node", "--experimental-strip-types", "-e", source],
            cwd=self.target,
            capture_output=True,
            text=True,
            env=os.environ.copy(),
        )

    def init_git_repo(self) -> None:
        subprocess.run(["git", "init"], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "config", "user.name", "Test User"], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=self.target, check=True, capture_output=True, text=True)

    def read_events(self) -> list[dict]:
        events_path = self.target / "output" / "ai" / "command-gain" / "events.jsonl"
        if not events_path.exists():
            return []
        return [json.loads(line) for line in events_path.read_text(encoding="utf8").splitlines() if line.strip()]

    def test_preflight_summary_records_true_adoption_denominator(self) -> None:
        direct = self.run_script("scripts/coord/preflight.ts", "--taskId=t-070")
        self.assertEqual(direct.returncode, 0, msg=direct.stdout or direct.stderr)

        completed = self.run_script("scripts/ai/preflight-summary.ts", "--taskId=t-070")
        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertIn("summary: preflight 已通过", completed.stdout)
        self.assertNotIn("raw tee:", completed.stdout)

        events = self.read_events()
        self.assertEqual(len(events), 3)
        self.assertEqual(sum(1 for event in events if event["event_kind"] == "shortcut_opportunity"), 2)
        self.assertEqual(sum(1 for event in events if event["event_kind"] == "summary_run"), 1)

        report = self.run_script("scripts/ai/command-gain.ts", "--json")
        payload = json.loads(report.stdout)
        shortcut = next(item for item in payload["shortcut_adoption"] if item["shortcut_id"] == "preflight_summary")
        self.assertEqual(shortcut["opportunity_count"], 2)
        self.assertEqual(shortcut["adopted_count"], 1)
        self.assertEqual(shortcut["usage_count"], 1)

    def test_review_summary_preserves_exit_code_and_writes_raw_tee(self) -> None:
        completed = self.run_script("scripts/ai/review-summary.ts", "--taskId=t-070")
        self.assertEqual(completed.returncode, 1, msg=completed.stdout or completed.stderr)
        self.assertIn("summary: review 未通过", completed.stdout)
        self.assertIn("raw tee:", completed.stdout)

        tee_dir = self.target / "output" / "ai" / "command-tee"
        tee_files = list(tee_dir.glob("*.json"))
        self.assertEqual(len(tee_files), 1)

        events = self.read_events()
        summary_event = next(event for event in events if event["event_kind"] == "summary_run")
        self.assertEqual(summary_event["exit_code"], 1)
        self.assertFalse(summary_event["was_fallback"])
        self.assertIsNotNone(summary_event["tee_path"])

    def test_validate_static_summary_groups_failures(self) -> None:
        completed = self.run_script("scripts/ai/validate-static-summary.ts")
        self.assertEqual(completed.returncode, 1, msg=completed.stdout or completed.stderr)
        self.assertIn("summary: validate:static 失败", completed.stdout)
        self.assertIn("stats: script=validate:static", completed.stdout)
        self.assertIn("scope (2):", completed.stdout)
        self.assertIn("lint.ts (2):", completed.stdout)

    def test_command_gain_retention_and_tee_cleanup_work_with_small_thresholds(self) -> None:
        source = """
        const fs = require("node:fs");
        const path = require("node:path");
        const { appendCommandGainEvent, buildCommandGainReport } = require("./scripts/ai/lib/command-gain.ts");
        const { runSummaryHarness } = require("./scripts/ai/lib/summary-harness.ts");

        const root = process.cwd();
        appendCommandGainEvent(root, {
          event_kind: "summary_run",
          timestamp: "2025-01-01T00:00:00.000Z",
          profile_id: "old",
          profile_version: "1",
          original_cmd: "old",
          input_tokens_est: 100,
          output_tokens_est: 50,
          saved_tokens_est: 50,
          savings_pct_est: 50,
          exec_time_ms: 10,
          exit_code: 0,
          was_fallback: false,
          filter_error: null,
          raw_bytes: 100,
          compact_bytes: 50,
          tee_path: null,
        });

        const teeDir = path.join(root, "output", "ai", "command-tee");
        fs.mkdirSync(teeDir, { recursive: true });
        fs.writeFileSync(path.join(teeDir, "expired.json"), JSON.stringify({ old: true }));
        const oldTime = Date.now() - 48 * 60 * 60 * 1000;
        fs.utimesSync(path.join(teeDir, "expired.json"), oldTime / 1000, oldTime / 1000);
        fs.writeFileSync(path.join(teeDir, "keep-a.json"), "A".repeat(80));
        fs.writeFileSync(path.join(teeDir, "keep-b.json"), "B".repeat(80));

        const result = runSummaryHarness({
          root,
          profile: {
            profile_id: "test_profile",
            profile_version: "1",
            pipeline: ["failure_focus", "error_only", "deduplication"],
            tee_policy: { ttl_hours: 24, max_files: 2, max_total_bytes: 150 },
            fallback_policy: { mode: "raw_with_notice" },
            parser_slots: [],
            shortcut_id: null,
          },
          cliFlags: {},
          passthroughArgs: [],
          command: {
            cmd: "node",
            args: ["-e", "console.error('alpha'); console.error('alpha'); process.exit(1);"],
            original_cmd: "node test-command",
          },
        });

        const report = buildCommandGainReport(root, { days: 90 });
        console.log(JSON.stringify({
          exitCode: result.exitCode,
          teePath: result.payload.tee_path,
          teeFiles: fs.readdirSync(teeDir).sort(),
          totalRuns: report.totals.summary_runs,
          profiles: report.by_profile.map((item) => item.profile_id),
        }));
        """
        completed = self.run_node(textwrap.dedent(source))
        payload = json.loads(completed.stdout)

        self.assertEqual(payload["exitCode"], 1)
        self.assertEqual(payload["totalRuns"], 1)
        self.assertIn("test_profile", payload["profiles"])
        self.assertNotIn("expired.json", payload["teeFiles"])
        self.assertLessEqual(len(payload["teeFiles"]), 2)

    def test_context_packet_events_flow_into_dashboard_density(self) -> None:
        source = """
        const { recordContextPacketEvent, buildCommandGainReport } = require("./scripts/ai/lib/command-gain.ts");

        const root = process.cwd();
        recordContextPacketEvent(root, {
          profileId: "feature_context_balanced",
          profileVersion: "1",
          taskId: "t-101",
          originalCmd: "pnpm ai:feature-context -- --taskPath=tasks/queue/task-101.md",
          rawBytes: 1600,
          compactBytes: 480,
          outputText: "balanced packet",
        });
        recordContextPacketEvent(root, {
          profileId: "build_context_expanded",
          profileVersion: "1",
          taskId: "t-101",
          originalCmd: "pnpm ai:build-context tasks/queue/task-101.md --expanded",
          rawBytes: 2400,
          compactBytes: 1040,
          outputText: "expanded packet",
        });

        const report = buildCommandGainReport(root, { days: 30 });
        console.log(JSON.stringify(report));
        """
        completed = self.run_node(textwrap.dedent(source))
        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        payload = json.loads(completed.stdout)
        density = payload["dashboard"]["context_density"]

        self.assertEqual(density["total_packets"], 2)
        self.assertEqual(density["balanced_runs"], 1)
        self.assertEqual(density["expanded_runs"], 1)
        self.assertEqual(density["total_saved_tokens_est"], 620)
        self.assertEqual(density["total_input_tokens_est"], 1000)
        self.assertEqual(density["total_output_tokens_est"], 380)
        self.assertEqual(density["top_context_heavy_tasks"][0]["task_id"], "t-101")

    def test_tree_summary_reports_directory_distribution(self) -> None:
        (self.target / "apps" / "studio").mkdir(parents=True, exist_ok=True)
        (self.target / "apps" / "studio" / "page.tsx").write_text("export default function Page() {}\n", encoding="utf8")
        (self.target / "shared").mkdir(parents=True, exist_ok=True)
        (self.target / "shared" / "feature-context.ts").write_text("export const value = 1;\n", encoding="utf8")
        (self.target / "docs" / "guide.md").parent.mkdir(parents=True, exist_ok=True)
        (self.target / "docs" / "guide.md").write_text("# guide\n", encoding="utf8")

        completed = self.run_script("scripts/ai/tree-summary.ts")
        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertIn("summary: 仓库结构已摘要", completed.stdout)
        self.assertIn("total_files=", completed.stdout)
        self.assertIn("目录分布：", completed.stdout)

    def test_find_summary_reports_match_counts(self) -> None:
        (self.target / "apps" / "studio").mkdir(parents=True, exist_ok=True)
        (self.target / "apps" / "studio" / "page.tsx").write_text("export const portalKeyword = 'home';\n", encoding="utf8")
        (self.target / "docs").mkdir(parents=True, exist_ok=True)
        (self.target / "docs" / "guide.md").write_text("portalKeyword appears here too\n", encoding="utf8")

        completed = self.run_script("scripts/ai/find-summary.ts", "--query=portalKeyword")
        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertIn("summary: 查找结果已摘要", completed.stdout)
        self.assertIn("total_matches=2", completed.stdout)
        self.assertIn("matched_files=2", completed.stdout)
        self.assertIn("top_files=", completed.stdout)

    def test_find_summary_zero_match_preserves_exit_code(self) -> None:
        completed = self.run_script("scripts/ai/find-summary.ts", "--query=missingKeyword")
        self.assertEqual(completed.returncode, 1, msg=completed.stdout or completed.stderr)
        self.assertIn("summary: 未找到匹配", completed.stdout)
        self.assertIn("raw tee:", completed.stdout)

    def test_read_summary_supports_module_task_markdown_code_and_data(self) -> None:
        self.write_stub(
            "apps/studio/src/modules/sample/module.md",
            """
            # sample

            ## 模块目标

            让 sample 模块成为读仓摘要测试样本。

            ## 入口与拥有面

            - 页面：`/sample`
            - CLI：`pnpm sample`

            ## 常改文件

            - `apps/studio/src/modules/sample/index.ts`

            ## 不变量

            - 输出必须稳定

            ## 推荐校验

            - `pnpm lint`
            """,
        )
        self.write_stub(
            "tasks/queue/task-900-demo.md",
            """
            # 演示任务

            ## 任务摘要

            - 任务 ID：`task-900-demo`
            - 短编号：`t-900`
            - 父计划：`memory/project/operating-blueprint.md`
            - 任务摘要：补演示任务
            - 为什么现在：需要验证 read_summary
            - 承接边界：只验证任务合同解析
            - 完成定义：输出任务合同摘要

            ## 执行合同

            ### 要做

            - `tasks/queue/task-900-demo.md`

            ## 当前模式

            工程执行

            ## 分支

            `codex/task-900`
            """,
        )
        self.write_stub(
            "docs/read-summary.md",
            """
            # Read Summary

            这是一份通用 markdown 文档，用于验证 headings 和 bullet 组提取。

            ## Checklist

            - first bullet
            - second bullet

            ## Notes

            - third bullet
            """,
        )
        self.write_stub(
            "scripts/fake/reader.ts",
            """
            // Reader entry for summary tests
            import fs from "node:fs";

            export function readValue() {
              return fs.readFileSync("README.md", "utf8");
            }

            export const readerName = "summary-reader";
            """,
        )
        self.write_stub(
            "config/sample.json",
            """
            {
              "name": "sample",
              "enabled": true,
              "paths": ["apps", "docs"]
            }
            """,
        )
        self.write_stub(
            "config/sample.yaml",
            """
            name: sample
            enabled: true
            entry: docs/read-summary.md
            mode: summary
            """,
        )

        module_summary = self.run_script("scripts/ai/read-summary.ts", "--path=apps/studio/src/modules/sample/module.md")
        task_summary = self.run_script("scripts/ai/read-summary.ts", "--path=tasks/queue/task-900-demo.md")
        markdown_summary = self.run_script("scripts/ai/read-summary.ts", "--path=docs/read-summary.md")
        code_summary = self.run_script("scripts/ai/read-summary.ts", "--path=scripts/fake/reader.ts")
        json_summary = self.run_script("scripts/ai/read-summary.ts", "--path=config/sample.json")
        yaml_summary = self.run_script("scripts/ai/read-summary.ts", "--path=config/sample.yaml")

        self.assertIn("summary: sample 模块合同已摘要", module_summary.stdout)
        self.assertIn("summary: t-900 任务合同已摘要", task_summary.stdout)
        self.assertIn("summary: Markdown 结构已摘要", markdown_summary.stdout)
        self.assertIn("summary: 代码文件结构已摘要", code_summary.stdout)
        self.assertIn("summary: JSON 结构已摘要", json_summary.stdout)
        self.assertIn("summary: YAML 结构已摘要", yaml_summary.stdout)

    def test_read_summary_missing_file_falls_back_to_raw(self) -> None:
        completed = self.run_script("scripts/ai/read-summary.ts", "--path=missing-file.md")
        self.assertEqual(completed.returncode, 1, msg=completed.stdout or completed.stderr)
        self.assertIn("fallback:", completed.stdout)
        self.assertIn("raw tee:", completed.stdout)

    def test_diff_summary_reports_changed_files(self) -> None:
        self.init_git_repo()
        target_file = self.target / "README.md"
        target_file.write_text("line 1\nline 2\n", encoding="utf8")
        subprocess.run(["git", "add", "README.md"], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "commit", "-m", "baseline"], cwd=self.target, check=True, capture_output=True, text=True)
        target_file.write_text("line 1\nline 2 updated\nline 3\n", encoding="utf8")

        completed = self.run_script("scripts/ai/diff-summary.ts")
        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertIn("summary: 差异已摘要", completed.stdout)
        self.assertIn("files_changed=1", completed.stdout)
        self.assertIn("README.md: +2 -1", completed.stdout)

    def test_shared_default_summary_workflow_matches_default_entry(self) -> None:
        completed = self.run_node(
            """
            const { buildSummaryFirstWorkflow } = require("./shared/ai-efficiency.ts");
            console.log(JSON.stringify(buildSummaryFirstWorkflow()));
            """
        )
        payload = json.loads(completed.stdout)

        self.assertEqual(payload["summary_first_commands"][0], "pnpm ai:preflight:summary")
        self.assertIn("pnpm ai:diff:summary", payload["summary_first_commands"])
        self.assertIn("pnpm ai:tree:summary", payload["summary_first_commands"])
        self.assertIn("pnpm ai:find:summary -- --query=keyword", payload["summary_first_commands"])
        self.assertIn("pnpm ai:read:summary -- --path=memory/project/current-state.md", payload["summary_first_commands"])
        self.assertEqual(payload["raw_fallback_commands"][0], "pnpm preflight")
        self.assertIn("git diff", payload["raw_fallback_commands"])
        self.assertIn("rg --files --hidden", payload["raw_fallback_commands"])
        self.assertIn("rg -n --hidden keyword", payload["raw_fallback_commands"])
        self.assertIn("sed -n '1,200p' memory/project/current-state.md", payload["raw_fallback_commands"])

    def test_command_gain_json_includes_dashboard(self) -> None:
        self.run_script("scripts/ai/validate-static-summary.ts")
        report = self.run_script("scripts/ai/command-gain.ts", "--json")
        payload = json.loads(report.stdout)

        self.assertIn("dashboard", payload)
        self.assertIn("coverage", payload)
        self.assertIn("trend_delta", payload)
        self.assertIn("task_rollups", payload)
        self.assertIn("overview", payload["dashboard"])
        self.assertIn("consumption", payload["dashboard"])
        self.assertIn("savings", payload["dashboard"])
        self.assertIn("adoption", payload["dashboard"])
        self.assertIn("coverage", payload["dashboard"])
        self.assertIn("trend_delta", payload["dashboard"])
        self.assertIn("task_rollups", payload["dashboard"])

    def test_turn_report_aggregates_recent_summary_and_context_costs(self) -> None:
        since = "2026-03-26T00:00:00.000Z"
        source = f"""
        require("node:fs").mkdirSync("tasks/queue", {{ recursive: true }});
        const {{ appendCommandGainEvent }} = require("./scripts/ai/lib/command-gain.ts");
        const {{ buildTurnReport, formatTurnReportText }} = require("./scripts/ai/lib/turn-report.ts");

        const root = process.cwd();
        appendCommandGainEvent(root, {{
          event_kind: "summary_run",
          timestamp: "2026-03-26T01:00:00.000Z",
          profile_id: "validate_build_summary",
          profile_version: "1",
          task_id: "t-101",
          original_cmd: "pnpm validate:build",
          input_tokens_est: 1200,
          output_tokens_est: 120,
          saved_tokens_est: 1080,
          savings_pct_est: 90,
          exec_time_ms: 8000,
          exit_code: 0,
          was_fallback: false,
          filter_error: null,
          raw_bytes: 4800,
          compact_bytes: 480,
          tee_path: null,
          shortcut_id: "validate_build_summary",
        }});
        appendCommandGainEvent(root, {{
          event_kind: "context_packet",
          timestamp: "2026-03-26T01:05:00.000Z",
          profile_id: "feature_context_balanced",
          profile_version: "1",
          task_id: "t-101",
          original_cmd: "pnpm ai:feature-context -- --taskPath=tasks/queue/task-101.md",
          input_tokens_est: 600,
          output_tokens_est: 240,
          saved_tokens_est: 360,
          savings_pct_est: 60,
          exec_time_ms: 1200,
          exit_code: 0,
          was_fallback: false,
          filter_error: null,
          raw_bytes: 2400,
          compact_bytes: 960,
          tee_path: null,
          shortcut_id: null,
        }});
        appendCommandGainEvent(root, {{
          event_kind: "shortcut_opportunity",
          timestamp: "2026-03-26T01:06:00.000Z",
          profile_id: "preflight_summary",
          profile_version: "1",
          task_id: "t-101",
          shortcut_id: "preflight_summary",
          original_cmd: "pnpm preflight -- --taskId=t-101",
          input_tokens_est: 0,
          output_tokens_est: 0,
          saved_tokens_est: 0,
          savings_pct_est: 0,
          exec_time_ms: 0,
          exit_code: 0,
          was_fallback: false,
          filter_error: null,
          raw_bytes: 0,
          compact_bytes: 0,
          tee_path: null,
          adopted: false,
        }});

        const report = buildTurnReport(root, {{ since: "{since}", taskId: "t-101" }});
        console.log(JSON.stringify({{
          report,
          text: formatTurnReportText(report),
        }}));
        """
        completed = self.run_node(textwrap.dedent(source))
        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        payload = json.loads(completed.stdout)
        report = payload["report"]
        text = payload["text"]

        self.assertEqual(report["task_id"], "t-101")
        self.assertEqual(report["summary_runs"], 1)
        self.assertEqual(report["context_packets"], 1)
        self.assertEqual(report["summary_saved_tokens_est"], 1080)
        self.assertEqual(report["context_saved_tokens_est"], 360)
        self.assertEqual(report["total_input_tokens_est"], 1800)
        self.assertEqual(report["total_output_tokens_est"], 360)
        self.assertEqual(report["total_saved_tokens_est"], 1440)
        self.assertIn("回合量化", text)
        self.assertIn("Token：~1.8K -> 360，saved ~1.4K", text)
        self.assertIn("上下文：1 packets；摘要：1 runs", text)
        self.assertNotIn("提示：", text)
        self.assertLessEqual(len(text.splitlines()), 5)

    def test_turn_report_omits_hint_when_no_signal_exists(self) -> None:
        since = "2026-03-26T00:00:00.000Z"
        source = f"""
        const {{ buildTurnReport, formatTurnReportText }} = require("./scripts/ai/lib/turn-report.ts");
        const report = buildTurnReport(process.cwd(), {{ since: "{since}" }});
        console.log(JSON.stringify({{
          report,
          text: formatTurnReportText(report),
        }}));
        """
        completed = self.run_node(textwrap.dedent(source))
        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        payload = json.loads(completed.stdout)
        text = payload["text"]

        self.assertEqual(payload["report"]["summary_runs"], 0)
        self.assertEqual(payload["report"]["context_packets"], 0)
        self.assertNotIn("提示：", text)
        self.assertEqual(len(text.splitlines()), 4)

    def test_turn_report_emits_hint_only_when_missed_shortcut_has_positive_savings_estimate(self) -> None:
        since = "2026-03-26T00:00:00.000Z"
        source = f"""
        const {{ appendCommandGainEvent }} = require("./scripts/ai/lib/command-gain.ts");
        const {{ buildTurnReport, formatTurnReportText }} = require("./scripts/ai/lib/turn-report.ts");

        const root = process.cwd();
        appendCommandGainEvent(root, {{
          event_kind: "summary_run",
          timestamp: "2026-03-26T01:00:00.000Z",
          profile_id: "preflight_summary",
          profile_version: "1",
          task_id: "t-201",
          original_cmd: "pnpm preflight -- --taskId=t-201",
          input_tokens_est: 1000,
          output_tokens_est: 100,
          saved_tokens_est: 900,
          savings_pct_est: 90,
          exec_time_ms: 1200,
          exit_code: 0,
          was_fallback: false,
          filter_error: null,
          raw_bytes: 4000,
          compact_bytes: 400,
          tee_path: null,
          shortcut_id: "preflight_summary",
        }});
        appendCommandGainEvent(root, {{
          event_kind: "shortcut_opportunity",
          timestamp: "2026-03-26T01:05:00.000Z",
          profile_id: "preflight_summary",
          profile_version: "1",
          task_id: "t-201",
          shortcut_id: "preflight_summary",
          original_cmd: "pnpm preflight -- --taskId=t-201",
          input_tokens_est: 0,
          output_tokens_est: 0,
          saved_tokens_est: 0,
          savings_pct_est: 0,
          exec_time_ms: 0,
          exit_code: 0,
          was_fallback: false,
          filter_error: null,
          raw_bytes: 0,
          compact_bytes: 0,
          tee_path: null,
          adopted: false,
        }});

        const report = buildTurnReport(root, {{ since: "{since}", taskId: "t-201" }});
        console.log(JSON.stringify({{
          report,
          text: formatTurnReportText(report),
        }}));
        """
        completed = self.run_node(textwrap.dedent(source))
        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["report"]["top_hint"], "本轮未使用 preflight_summary，潜在可节省 ~900 tokens")
        self.assertIn("提示：本轮未使用 preflight_summary，潜在可节省 ~900 tokens", payload["text"])

    def test_turn_report_labels_historical_task_shortcut_hints_as_task_history(self) -> None:
        since = "2026-03-26T01:30:00.000Z"
        source = f"""
        const {{ appendCommandGainEvent }} = require("./scripts/ai/lib/command-gain.ts");
        const {{ buildTurnReport, formatTurnReportText }} = require("./scripts/ai/lib/turn-report.ts");

        const root = process.cwd();
        appendCommandGainEvent(root, {{
          event_kind: "summary_run",
          timestamp: "2026-03-26T01:00:00.000Z",
          profile_id: "preflight_summary",
          profile_version: "1",
          task_id: "t-202",
          original_cmd: "pnpm preflight -- --taskId=t-202",
          input_tokens_est: 1000,
          output_tokens_est: 100,
          saved_tokens_est: 900,
          savings_pct_est: 90,
          exec_time_ms: 1200,
          exit_code: 0,
          was_fallback: false,
          filter_error: null,
          raw_bytes: 4000,
          compact_bytes: 400,
          tee_path: null,
          shortcut_id: "preflight_summary",
        }});
        appendCommandGainEvent(root, {{
          event_kind: "shortcut_opportunity",
          timestamp: "2026-03-26T01:05:00.000Z",
          profile_id: "preflight_summary",
          profile_version: "1",
          task_id: "t-202",
          shortcut_id: "preflight_summary",
          original_cmd: "pnpm preflight -- --taskId=t-202",
          input_tokens_est: 0,
          output_tokens_est: 0,
          saved_tokens_est: 0,
          savings_pct_est: 0,
          exec_time_ms: 0,
          exit_code: 0,
          was_fallback: false,
          filter_error: null,
          raw_bytes: 0,
          compact_bytes: 0,
          tee_path: null,
          adopted: false,
        }});
        appendCommandGainEvent(root, {{
          event_kind: "shortcut_opportunity",
          timestamp: "2026-03-26T01:10:00.000Z",
          profile_id: "preflight_summary",
          profile_version: "1",
          task_id: "t-202",
          shortcut_id: "preflight_summary",
          original_cmd: "pnpm preflight -- --taskId=t-202",
          input_tokens_est: 0,
          output_tokens_est: 0,
          saved_tokens_est: 0,
          savings_pct_est: 0,
          exec_time_ms: 0,
          exit_code: 0,
          was_fallback: false,
          filter_error: null,
          raw_bytes: 0,
          compact_bytes: 0,
          tee_path: null,
          adopted: false,
        }});

        const report = buildTurnReport(root, {{ since: "{since}", taskId: "t-202" }});
        console.log(JSON.stringify({{
          report,
          text: formatTurnReportText(report),
        }}));
        """
        completed = self.run_node(textwrap.dedent(source))
        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["report"]["top_hint"], "当前 task 历史上未充分使用 preflight_summary，累计潜在可节省 ~1.8K tokens")
        self.assertIn("提示：当前 task 历史上未充分使用 preflight_summary，累计潜在可节省 ~1.8K tokens", payload["text"])


if __name__ == "__main__":
    unittest.main()
