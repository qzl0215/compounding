import json
import shutil
import subprocess
import unittest
from tests.coord_support import ROOT, CoordCliTestCase, SAMPLE_TASK_MARKDOWN


class CoordCliTests(CoordCliTestCase):
    def mark_sample_task_done(self) -> None:
        task_path = self.target / "tasks" / "queue" / "task-999-sample.md"
        task_path.write_text(
            SAMPLE_TASK_MARKDOWN.replace("- 状态：doing", "- 状态：done"),
            encoding="utf8",
        )

    def prepare_merged_sample_branch(self) -> str:
        self.mark_sample_task_done()
        self.init_git_repo()
        subprocess.run(["git", "checkout", "-b", "codex/task-999-sample"], cwd=self.target, check=True)
        (self.target / "README.md").write_text("feature branch\n", encoding="utf8")
        subprocess.run(["git", "add", "README.md"], cwd=self.target, check=True)
        subprocess.run(["git", "commit", "-m", "feature work"], cwd=self.target, check=True)
        feature_sha = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=self.target,
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        subprocess.run(["git", "checkout", "main"], cwd=self.target, check=True)
        subprocess.run(["git", "merge", "--ff-only", "codex/task-999-sample"], cwd=self.target, check=True)
        return feature_sha

    def assert_change_packet_aliases(self, payload: dict) -> None:
        packet = payload["change_packet"]
        self.assertEqual(packet["observation_mode"], payload["observation_mode"])
        self.assertEqual(packet["change_source"], payload["change_source"])
        self.assertEqual(packet["changed_files"], payload["changed_files"])
        self.assertEqual(packet["change_class"], payload["change_class"])
        self.assertEqual(packet["change_reason"], payload["change_reason"])
        self.assertEqual(packet["change_evidence"], payload["change_evidence"])
        self.assertEqual(packet["policy"], payload["policy"])


    def test_create_task_renders_from_canonical_template(self) -> None:
        template_path = self.target / "tasks" / "templates" / "task-template.md"
        template_path.write_text(
            template_path.read_text(encoding="utf8").replace("## 执行合同", "## 执行合同（单点模板）"),
            encoding="utf8",
        )

        completed = self.run_script(
            "scripts/ai/create-task.ts",
            "task-123-generated",
            "建立单点模板",
            "避免 task 合同骨架继续多处漂移",
        )

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        created = (self.target / "tasks" / "queue" / "task-123-generated.md").read_text(encoding="utf8")
        self.assertIn("# 建立单点模板", created)
        self.assertIn("- 任务 ID：`task-123-generated`", created)
        self.assertIn("## 执行合同（单点模板）", created)
        self.assertNotIn("{{", created)

    def test_create_task_accepts_plan_contract_fields(self) -> None:
        completed = self.run_script(
            "scripts/ai/create-task.ts",
            "task-124-contract-draft",
            "把边界说清",
            "先把关键决策收口，再进入执行",
            "--parentPlan=memory/project/operating-blueprint.md",
            "--boundary=只补执行合同字段，不扩到页面或运行时",
            "--doneWhen=体验级验收标准已经清楚，且 task 可直接进入执行",
            "--inScope=- 补 boundary\n- 补 done_when\n- 补 test_strategy",
            "--outOfScope=- 不改页面\n- 不改运行态",
            "--constraints=- 只允许一层 plan\n- 不引入新状态源",
            "--risk=- 边界写散会把 task 再做回说明书",
            "--testReason=验证 Autoplan 可以把关键决策直接落到 task 合同。",
            "--testScope=task 模板输出、字段回写、默认值覆盖。",
            "--testSkip=不测页面渲染。",
            "--testRoi=只锁最小合同字段，不扩大校验面。",
            "--status=doing",
            "--acceptanceResult=待验收",
            "--deliveryResult=任务合同已可直接承接执行。",
            "--retro=未复盘",
        )

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        created = (self.target / "tasks" / "queue" / "task-124-contract-draft.md").read_text(encoding="utf8")
        self.assertIn("只补执行合同字段，不扩到页面或运行时", created)
        self.assertIn("体验级验收标准已经清楚，且 task 可直接进入执行", created)
        self.assertIn("验证 Autoplan 可以把关键决策直接落到 task 合同。", created)
        self.assertIn("# 把边界说清", created)
        self.assertIn("## 当前模式", created)
        self.assertIn("工程执行", created)
        self.assertIn("`codex/task-124-contract-draft`", created)
        self.assertNotIn("{{", created)

    def test_create_task_rejects_english_summary(self) -> None:
        completed = self.run_script(
            "scripts/ai/create-task.ts",
            "task-127-title-policy",
            "统一 task 标题",
            "需要避免新任务继续把英文名字写进人类标题",
        )

        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("任务标题必须使用中文直给概述", completed.stderr)

    def test_create_task_supports_json_output(self) -> None:
        completed = self.run_script(
            "scripts/ai/create-task.ts",
            "task-126-json",
            "统一任务创建输出",
            "避免脚本层继续各自维护不同的成功结果格式",
            "--json",
        )

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        payload = json.loads(completed.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["task_id"], "task-126-json")
        self.assertEqual(payload["short_id"], "t-126")
        self.assertTrue(payload["path"].endswith("tasks/queue/task-126-json.md"))

    def test_create_task_can_seed_related_modules_into_companion_scope(self) -> None:
        completed = self.run_script(
            "scripts/ai/create-task.ts",
            "task-125-machine-facts",
            "让新任务默认带最小机器事实",
            "避免结构任务还要靠手工补关联模块才能通过范围校验",
            "--relatedModules=- `scripts/compounding_bootstrap/`\n- `package.json`\n- `schemas/`",
        )

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        payload = self.run_node(
            f"""
const fs = require("node:fs");
const path = require("node:path");
const {{ getCompanionPath }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
const file = getCompanionPath("task-125-machine-facts");
console.log(fs.readFileSync(file, "utf8"));
"""
        )

        self.assertEqual(
            payload["planned_files"],
            [
                "tasks/queue/task-125-machine-facts.md",
                "scripts/compounding_bootstrap/",
                "package.json",
                "schemas/",
            ],
        )

    def test_template_feedback_orchestrator_uses_canonical_task_template(self) -> None:
        template_path = self.target / "tasks" / "templates" / "task-template.md"
        template_path.write_text(
            template_path.read_text(encoding="utf8").replace("## 交付结果", "## 交付结果（单点模板）"),
            encoding="utf8",
        )

        completed = subprocess.run(
            ["node", str(ROOT / "scripts/ai/template-feedback-orchestrator.js"), "generate-task"],
            cwd=self.target,
            capture_output=True,
            text=True,
        )

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertIn("## 交付结果（单点模板）", completed.stdout)

    def test_template_feedback_orchestrator_supports_json_output(self) -> None:
        completed = subprocess.run(
            [
                "node",
                str(ROOT / "scripts/ai/template-feedback-orchestrator.js"),
                "generate-task",
                "--json",
            ],
            cwd=self.target,
            capture_output=True,
            text=True,
        )

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        payload = json.loads(completed.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["command"], "generate-task")
        self.assertTrue(payload["validation"]["valid"])
        self.assertIn("## 任务摘要", payload["content"])

    def test_fix_first_orchestrator_supports_json_output(self) -> None:
        (self.target / "package.json").write_text(
            json.dumps(
                {
                    "name": "coord-cli-fixtures",
                    "private": True,
                    "scripts": {
                        "lint": "node -e \"process.exit(0)\"",
                        "test": "node -e \"process.exit(0)\"",
                        "build": "node -e \"process.exit(0)\"",
                        "preview:check": "node -e \"process.exit(0)\"",
                        "ai:validate-trace": "node -e \"process.exit(0)\"",
                        "ai:validate-task-git": "node -e \"process.exit(0)\"",
                    },
                }
            ),
            encoding="utf8",
        )

        completed = subprocess.run(
            ["node", str(ROOT / "scripts/ai/fix-first-orchestrator.js"), "--json"],
            cwd=self.target,
            capture_output=True,
            text=True,
        )

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        payload = json.loads(completed.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["summary"]["askRequired"], 0)
        self.assertEqual(payload["summary"]["total"], 6)

    def test_companion_lifecycle_records_pre_task_review_and_release_handoff(self) -> None:
        script_root = ROOT.as_posix()
        payload = self.run_node(
            f"""
const fs = require("node:fs");
const {{ ensureCompanion, getCompanionPath, readCompanion }} = require("{script_root}/scripts/coord/lib/task-meta.ts");
const {{
  recordCreated,
  recordPreTaskResult,
  recordHandoff,
  recordReviewResult,
  recordReleaseHandoff,
  recordSearchEvidence,
}} = require("{script_root}/scripts/coord/lib/companion-lifecycle.ts");
ensureCompanion("t-999");
recordCreated("t-999", {{ source: "test:create" }});
recordSearchEvidence("t-999", {{
  source: "test:search",
  scope: "runtime_capability",
  sources: ["repo", "docs"],
  conclusion: "现有 runtime 机制足够，无需新增基础设施。"
}});
recordPreTaskResult("t-999", {{
  ok: false,
  preflight_check: {{ ok: false }},
  runtime_check: {{ ok: true, statuses: [] }},
  scope_check: {{ ok: false, high_risk_undeclared: ["scripts/coord/check.ts"] }},
  lock_check: {{ ok: true, conflicts: [] }},
  blockers: [{{ step: "scope_guard", issue: "范围越界" }}],
  decision_card: {{
    decision_id: "dec-test",
    path: "agent-coordination/decisions/dec-test.json",
    decision: {{ decision_type: "pre_task_guard", generated_at: "2026-03-20T00:00:00.000Z" }}
  }},
  reason: "blocked"
}});
recordHandoff("t-999", {{ summary: "handoff summary", git_head: "abc123" }});
recordReviewResult("t-999", {{
  ok: true,
  merge_decision: "auto_merge",
  merge_confidence_score: 0.91,
  merge_decision_explanation: "All reviewers passed.",
  reviewers: [{{ name: "scope_reviewer", pass: true }}],
  diff_summary: {{
    path: "agent-coordination/reports/diff-summary-main-head.json",
    diff_summary: {{ ref_a: "main", ref_b: "HEAD", generated_at: "2026-03-20T00:00:00.000Z" }}
  }}
}});
recordReleaseHandoff("t-999", {{
  channel: "prod",
  release_id: "20260320-abc-prod",
  production_url: "http://127.0.0.1:3010",
  status: "active"
}});
console.log(JSON.stringify({{
  companion: readCompanion("t-999"),
  raw: JSON.parse(fs.readFileSync(getCompanionPath("t-999"), "utf8"))
}}, null, 2));
"""
        )

        companion = payload["companion"]
        raw = payload["raw"]

        self.assertEqual(companion["companion_phase"], "released")
        self.assertEqual(companion["lifecycle"]["handoff"]["summary"], "handoff summary")
        self.assertEqual(companion["lifecycle"]["review"]["merge_decision"], "auto_merge")
        self.assertEqual(companion["lifecycle"]["release_handoff"]["release_id"], "20260320-abc-prod")
        self.assertEqual(companion["artifacts"]["decision_cards"][-1]["decision_id"], "dec-test")
        self.assertEqual(companion["artifacts"]["diff_summaries"][-1]["path"], "agent-coordination/reports/diff-summary-main-head.json")
        self.assertEqual(companion["artifacts"]["search_evidence"][-1]["conclusion"], "现有 runtime 机制足够，无需新增基础设施。")
        self.assertEqual(companion["artifacts"]["change_cost_snapshot"]["effect"]["release_state"], "released")
        self.assertEqual(raw["task_id"], "t-999")
        self.assertEqual(raw["task_path"], "tasks/queue/task-999-sample.md")
        self.assertTrue(bool(raw["contract_hash"]))
        self.assertEqual(raw["branch_name"], "codex/task-999-sample")
        self.assertEqual(raw["completion_mode"], "close_full_contract")
        self.assertEqual(raw["planned_files"], ["tasks/queue/task-999-sample.md"])
        self.assertEqual(raw["planned_modules"], [])
        self.assertEqual(raw["locks"], [])
        self.assertNotIn("title", raw)
        self.assertNotIn("goal", raw)
        self.assertNotIn("contract", raw)
        self.assertNotIn("status", raw)
        self.assertNotIn("companion_phase", raw)
        self.assertNotIn("summary_artifacts", raw)

    def test_ai_task_cost_cli_prefers_live_activity_and_falls_back_to_snapshot_code(self) -> None:
        script_root = ROOT.as_posix()
        payload = self.run_node(
            f"""
const fs = require("node:fs");
const path = require("node:path");
const {{ ensureCompanion, updateCompanion }} = require("{script_root}/scripts/coord/lib/task-meta.ts");
const {{ startActiveStage, finishActiveStage }} = require("{script_root}/scripts/coord/lib/task-activity.ts");
ensureCompanion("t-999");
startActiveStage("t-999", "execution", {{
  source: "test:execution",
  recordedAt: "2026-03-20T00:00:00.000Z",
}});
finishActiveStage("t-999", "execution", {{
  source: "test:execution",
  recordedAt: "2026-03-20T00:05:00.000Z",
  status: "passed",
  reason: "implemented",
}});
updateCompanion("t-999", (companion) => {{
  companion.artifacts.iteration_digest = {{
    updated_at: "2026-03-20T00:06:00.000Z",
    attempt_count: 2,
    active_ms_by_stage: {{ execution: 999999 }},
    wait_ms_by_stage: {{}},
    top_blockers: [],
    last_attempt: {{
      dominant_stage: "review",
      dominant_blocker: null,
    }},
    next_agent_hints: [],
  }};
  companion.artifacts.change_cost_snapshot = {{
    time: {{
      active_ms: 1,
      wait_ms: 2,
      total_ms: 3,
      dominant_stage: "snapshot",
      repeated_blockers: 0,
      latest_blockers: [],
    }},
    tokens: {{
      summary_runs: 0,
      context_packets: 0,
      summary_input_est: 0,
      summary_output_est: 0,
      summary_saved_est: 0,
      context_input_est: 0,
      context_output_est: 0,
      context_saved_est: 0,
    }},
    code: {{
      source: "snapshot",
      files: 7,
      insertions: 42,
      deletions: 9,
    }},
    effect: {{
      last_gate_failures: ["snapshot exit=1"],
      release_state: "in_progress",
      build_result: null,
      smoke_result: null,
      acceptance_status: null,
      blockers: [],
      status_summary: "snapshot",
    }},
  }};
  return companion;
}});
const gainDir = path.join(process.cwd(), "output", "ai", "command-gain");
fs.mkdirSync(gainDir, {{ recursive: true }});
fs.writeFileSync(
  path.join(gainDir, "events.jsonl"),
  [
    JSON.stringify({{
      schema_version: "1",
      profile_version: "1",
      timestamp: "2026-03-20T00:07:00.000Z",
      task_id: "t-999",
      shortcut_id: "preflight_summary",
      agent_surface: "repo_cli",
      original_cmd: "pnpm ai:preflight:summary -- --taskId=t-999",
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
      event_kind: "summary_run",
      adopted: true,
      profile_id: "preflight_summary",
    }}),
    JSON.stringify({{
      schema_version: "1",
      profile_version: "1",
      timestamp: "2026-03-20T00:08:00.000Z",
      task_id: "t-999",
      shortcut_id: null,
      agent_surface: "repo_cli",
      original_cmd: "pnpm ai:feature-context -- --taskId=t-999",
      input_tokens_est: 600,
      output_tokens_est: 180,
      saved_tokens_est: 420,
      savings_pct_est: 70,
      exec_time_ms: 800,
      exit_code: 0,
      was_fallback: false,
      filter_error: null,
      raw_bytes: 2400,
      compact_bytes: 720,
      tee_path: null,
      event_kind: "context_packet",
      adopted: null,
      profile_id: "feature_context_balanced",
    }})
  ].join("\\n") + "\\n",
  "utf8"
);
console.log(JSON.stringify({{ ok: true }}));
"""
        )
        self.assertTrue(payload["ok"])

        completed = self.run_script("scripts/ai/task-cost.ts", "--json", "--taskId=t-999")
        report = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(report["ok"])
        self.assertEqual(report["ledger"]["task_id"], "t-999")
        self.assertEqual(report["ledger"]["time"]["active_ms"], 300000)
        self.assertEqual(report["ledger"]["time"]["dominant_stage"], "execution")
        self.assertEqual(report["ledger"]["tokens"]["summary_input_est"], 1000)
        self.assertEqual(report["ledger"]["tokens"]["context_input_est"], 600)
        self.assertEqual(report["ledger"]["code"]["source"], "snapshot")
        self.assertEqual(report["ledger"]["code"]["files"], 7)

    def test_task_activity_compacts_expired_trace_into_iteration_digest(self) -> None:
        script_root = ROOT.as_posix()
        payload = self.run_node(
            f"""
const fs = require("node:fs");
const path = require("node:path");
const {{ ensureCompanion, readCompanion }} = require("{script_root}/scripts/coord/lib/task-meta.ts");
const {{
  compactExpiredActivity,
  recordBlocker,
  startActiveStage,
  finishActiveStage,
}} = require("{script_root}/scripts/coord/lib/task-activity.ts");
ensureCompanion("t-999");
startActiveStage("t-999", "preflight", {{
  source: "test:preflight",
  recordedAt: "2026-03-20T00:00:00.000Z",
}});
recordBlocker("t-999", "preflight", {{
  source: "test:preflight",
  recordedAt: "2026-03-20T00:00:05.000Z",
  reason: "工作区未清理",
  status: "blocked",
}});
finishActiveStage("t-999", "preflight", {{
  source: "test:preflight",
  recordedAt: "2026-03-20T00:00:05.000Z",
  status: "blocked",
  reason: "工作区未清理",
}});
compactExpiredActivity({{ now: "2026-03-22T01:00:00.000Z" }});
const activityDir = path.join(process.cwd(), "output", "agent_session", "task-activity", "task-999-sample");
const remaining = fs.existsSync(activityDir)
  ? fs.readdirSync(activityDir).filter((entry) => entry.endsWith(".jsonl"))
  : [];
console.log(JSON.stringify({{
  companion: readCompanion("t-999"),
  remaining,
}}, null, 2));
"""
        )

        digest = payload["companion"]["artifacts"]["iteration_digest"]
        self.assertEqual(payload["remaining"], [])
        self.assertEqual(digest["attempt_count"], 1)
        self.assertEqual(digest["active_ms_by_stage"]["preflight"], 5000)
        self.assertEqual(digest["top_blockers"][0]["reason"], "工作区未清理")
        self.assertEqual(digest["top_blockers"][0]["repeat_count"], 1)
        self.assertEqual(digest["top_blockers"][0]["lost_time_ms"], 5000)
        self.assertEqual(digest["last_attempt"]["dominant_stage"], "preflight")
        self.assertTrue(any("最近一次主要 blocker" in hint for hint in digest["next_agent_hints"]))

    def test_release_context_prefers_companion_release_handoff(self) -> None:
        script_root = ROOT.as_posix()
        payload = self.run_node(
            f"""
const {{ ensureCompanion, readCompanionReleaseContext }} = require("{script_root}/scripts/coord/lib/task-meta.ts");
const {{ recordReleaseHandoff }} = require("{script_root}/scripts/coord/lib/companion-lifecycle.ts");
ensureCompanion("t-999");
recordReleaseHandoff("t-999", {{
  channel: "dev",
  release_id: "20260320-abc-dev",
  preview_url: "http://127.0.0.1:3011",
  status: "preview"
}});
console.log(JSON.stringify(readCompanionReleaseContext("t-999"), null, 2));
"""
        )

        self.assertEqual(payload["latest_release_id"], "20260320-abc-dev")
        self.assertIsNone(payload["latest_diff_summary_path"])
        self.assertIsNone(payload["latest_decision_card_path"])

    def test_validate_change_trace_allows_light_docs_without_task_update(self) -> None:
        docs_dir = self.target / "docs"
        docs_dir.mkdir(parents=True, exist_ok=True)
        doc_path = docs_dir / "notes.md"
        doc_path.write_text("# Notes\n\ninitial\n", encoding="utf8")
        self.init_git_repo()
        doc_path.write_text("# Notes\n\nupdated\n", encoding="utf8")

        completed = self.run_script("scripts/ai/validate-change-trace.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assert_change_packet_aliases(payload)
        self.assertEqual(payload["observation_mode"], "recent")
        self.assertEqual(payload["change_source"], "worktree")
        self.assertEqual(payload["change_class"], "light")
        self.assertEqual(payload["change_evidence"]["classification_rule"], "all_light_files")
        self.assertEqual(payload["changed_tasks"], [])

    def test_validate_change_trace_rejects_placeholder_task_contract_fields(self) -> None:
        scripts_dir = self.target / "scripts"
        scripts_dir.mkdir(parents=True, exist_ok=True)
        (scripts_dir / "sample.ts").write_text("export const value = 1;\n", encoding="utf8")
        self.init_git_repo()
        subprocess.run(["git", "checkout", "-b", "codex/task-999-sample"], cwd=self.target, check=True)
        task_path = self.target / "tasks" / "queue" / "task-999-sample.md"
        (scripts_dir / "sample.ts").write_text("export const value = 2;\n", encoding="utf8")
        task_path.write_text(
            SAMPLE_TASK_MARKDOWN.replace(
                "需要确认 companion 生命周期与发布交接仍能围绕统一合同运作。",
                "待补充：说明为什么现在要做。",
            ),
            encoding="utf8",
        )

        completed = self.run_script("scripts/ai/validate-change-trace.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertFalse(payload["ok"])
        self.assertTrue(any("待补充占位内容" in error for error in payload["errors"]))

    def test_ensure_companion_updates_contract_hash_when_task_contract_changes(self) -> None:
        script_root = ROOT.as_posix()
        first = self.run_node(
            f"""
const fs = require("node:fs");
const path = require("node:path");
const {{ ensureCompanion, getCompanionPath }} = require("{script_root}/scripts/coord/lib/task-meta.ts");
ensureCompanion("t-999");
const firstRaw = JSON.parse(fs.readFileSync(getCompanionPath("t-999"), "utf8"));
const taskPath = path.join(process.cwd(), "tasks", "queue", "task-999-sample.md");
const source = fs.readFileSync(taskPath, "utf8");
fs.writeFileSync(
  taskPath,
  source.replace("- 任务摘要：\\n  验证 companion 生命周期。", "- 任务摘要：\\n  验证 companion 合同哈希。")
);
ensureCompanion("t-999");
const secondRaw = JSON.parse(fs.readFileSync(getCompanionPath("t-999"), "utf8"));
console.log(JSON.stringify({{
  first_hash: firstRaw.contract_hash,
  second_hash: secondRaw.contract_hash,
}}, null, 2));
"""
        )

        self.assertTrue(first["first_hash"])
        self.assertTrue(first["second_hash"])
        self.assertNotEqual(first["first_hash"], first["second_hash"])

    def test_update_companion_current_mode_survives_ensure_companion_refresh(self) -> None:
        script_root = ROOT.as_posix()
        payload = self.run_node(
            f"""
const {{ ensureCompanion, readCompanion, updateCompanion }} = require("{script_root}/scripts/coord/lib/task-meta.ts");
ensureCompanion("t-999");
updateCompanion("t-999", (companion) => {{
  companion.current_mode = "工程执行";
  return companion;
}});
ensureCompanion("t-999");
console.log(JSON.stringify(readCompanion("t-999"), null, 2));
"""
        )

        self.assertEqual(payload["current_mode"], "工程执行")

    def test_validate_change_trace_rejects_structural_change_without_task_update(self) -> None:
        scripts_dir = self.target / "scripts"
        scripts_dir.mkdir(parents=True, exist_ok=True)
        script_path = scripts_dir / "sample.ts"
        script_path.write_text("export const value = 1;\n", encoding="utf8")
        self.init_git_repo()
        script_path.write_text("export const value = 2;\n", encoding="utf8")

        completed = self.run_script("scripts/ai/validate-change-trace.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertFalse(payload["ok"])
        self.assert_change_packet_aliases(payload)
        self.assertEqual(payload["observation_mode"], "recent")
        self.assertEqual(payload["change_source"], "worktree")
        self.assertEqual(payload["change_class"], "structural")
        self.assertEqual(payload["change_evidence"]["classification_rule"], "has_non_light_non_release_files")
        self.assertTrue(any("没有任何 tasks/queue/*.md 变更" in error for error in payload["errors"]))

    def test_build_change_packet_reports_worktree_clean_basis(self) -> None:
        self.init_git_repo()
        payload = self.run_node(
            f"""
const {{ buildChangePacket }} = require("{ROOT.as_posix()}/scripts/ai/lib/change-policy.ts");
console.log(JSON.stringify(buildChangePacket(process.cwd(), {{ mode: "worktree" }}), null, 2));
"""
        )

        self.assertEqual(payload["observation_mode"], "worktree")
        self.assertEqual(payload["change_source"], "none")
        self.assertEqual(payload["changed_files"], [])
        self.assertEqual(payload["change_class"], "light")
        self.assertEqual(payload["change_evidence"]["classification_rule"], "no_observed_changes")
        self.assertEqual(payload["change_evidence"]["observation_basis"]["sources_checked"], ["git_status"])
        self.assertEqual(payload["change_evidence"]["observation_basis"]["selected_source"], "none")
        self.assertIsNone(payload["change_evidence"]["observation_basis"]["selected_ref"])

    def test_build_change_packet_reports_recent_commit_basis_when_worktree_is_clean(self) -> None:
        scripts_dir = self.target / "scripts"
        scripts_dir.mkdir(parents=True, exist_ok=True)
        script_path = scripts_dir / "sample.ts"
        script_path.write_text("export const value = 1;\n", encoding="utf8")
        self.init_git_repo()
        script_path.write_text("export const value = 2;\n", encoding="utf8")
        subprocess.run(["git", "add", "scripts/sample.ts"], cwd=self.target, check=True)
        subprocess.run(["git", "commit", "-m", "recent structural change"], cwd=self.target, check=True)

        payload = self.run_node(
            f"""
const {{ buildChangePacket }} = require("{ROOT.as_posix()}/scripts/ai/lib/change-policy.ts");
console.log(JSON.stringify(buildChangePacket(process.cwd(), {{ mode: "recent" }}), null, 2));
"""
        )

        self.assertEqual(payload["observation_mode"], "recent")
        self.assertEqual(payload["change_source"], "recent_commit")
        self.assertEqual(payload["change_class"], "structural")
        self.assertEqual(payload["change_evidence"]["classification_rule"], "has_non_light_non_release_files")
        self.assertEqual(payload["change_evidence"]["observation_basis"]["sources_checked"], ["git_status", "head_parent_diff"])
        self.assertEqual(payload["change_evidence"]["observation_basis"]["selected_source"], "recent_commit")
        self.assertEqual(payload["change_evidence"]["observation_basis"]["selected_ref"], "HEAD^..HEAD")

    def test_preflight_uses_basic_guard_without_task_id(self) -> None:
        self.install_preflight_fixtures()
        self.init_git_repo()

        completed = self.run_script("scripts/coord/preflight.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assert_change_packet_aliases(payload)
        self.assertEqual(payload["guard_level"], "basic")
        self.assertIsNone(payload["task_id"])
        self.assertEqual(payload["observation_mode"], "worktree")
        self.assertEqual(payload["change_source"], "none")
        self.assertEqual(payload["change_class"], "light")
        self.assertEqual(payload["change_evidence"]["classification_rule"], "no_observed_changes")
        self.assertEqual(payload["change_evidence"]["observation_basis"]["sources_checked"], ["git_status"])
        self.assertIn("preflight_check", payload)

    def test_preflight_keeps_dirty_light_change_at_light_but_still_blocks_on_unclean_worktree(self) -> None:
        self.install_preflight_fixtures()
        docs_dir = self.target / "docs"
        docs_dir.mkdir(parents=True, exist_ok=True)
        doc_path = docs_dir / "notes.md"
        doc_path.write_text("# Notes\n\ninitial\n", encoding="utf8")
        self.init_git_repo()
        doc_path.write_text("# Notes\n\nupdated\n", encoding="utf8")

        completed = self.run_script("scripts/coord/preflight.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertFalse(payload["ok"])
        self.assert_change_packet_aliases(payload)
        self.assertEqual(payload["guard_level"], "basic")
        self.assertEqual(payload["observation_mode"], "worktree")
        self.assertEqual(payload["change_source"], "worktree")
        self.assertEqual(payload["change_class"], "light")
        self.assertEqual(payload["change_evidence"]["classification_rule"], "all_light_files")
        self.assertEqual(payload["changed_files"], ["docs/notes.md"])
        self.assertTrue(any(item["step"] == "preflight" for item in payload["blockers"]))

    def test_preflight_rejects_structural_change_without_task_id(self) -> None:
        self.install_preflight_fixtures()
        scripts_dir = self.target / "scripts"
        script_path = scripts_dir / "sample.ts"
        script_path.write_text("export const value = 1;\n", encoding="utf8")
        self.init_git_repo()
        script_path.write_text("export const value = 2;\n", encoding="utf8")

        completed = self.run_script("scripts/coord/preflight.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertFalse(payload["ok"])
        self.assert_change_packet_aliases(payload)
        self.assertEqual(payload["guard_level"], "basic")
        self.assertEqual(payload["observation_mode"], "worktree")
        self.assertEqual(payload["change_source"], "worktree")
        self.assertEqual(payload["change_class"], "structural")
        self.assertEqual(payload["change_evidence"]["classification_rule"], "has_non_light_non_release_files")
        self.assertTrue(any(item["step"] == "task_binding" for item in payload["blockers"]))

    def test_preflight_ignores_recent_structural_commit_when_worktree_is_clean(self) -> None:
        self.install_preflight_fixtures()
        scripts_dir = self.target / "scripts"
        scripts_dir.mkdir(parents=True, exist_ok=True)
        script_path = scripts_dir / "sample.ts"
        script_path.write_text("export const value = 1;\n", encoding="utf8")
        self.init_git_repo()
        script_path.write_text("export const value = 2;\n", encoding="utf8")
        subprocess.run(["git", "add", "scripts/sample.ts"], cwd=self.target, check=True)
        subprocess.run(["git", "commit", "-m", "recent structural change"], cwd=self.target, check=True)

        completed = self.run_script("scripts/coord/preflight.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assert_change_packet_aliases(payload)
        self.assertEqual(payload["observation_mode"], "worktree")
        self.assertEqual(payload["change_source"], "none")
        self.assertEqual(payload["change_class"], "light")
        self.assertEqual(payload["change_evidence"]["classification_rule"], "no_observed_changes")
        self.assertEqual(payload["changed_files"], [])

    def test_scope_guard_reads_actual_files_from_change_packet(self) -> None:
        docs_dir = self.target / "docs"
        docs_dir.mkdir(parents=True, exist_ok=True)
        doc_path = docs_dir / "notes.md"
        doc_path.write_text("# Notes\n\ninitial\n", encoding="utf8")
        self.init_git_repo()
        doc_path.write_text("# Notes\n\nupdated\n", encoding="utf8")

        completed = self.run_script("scripts/coord/scope-guard.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assert_change_packet_aliases(payload)
        self.assertEqual(payload["observation_mode"], "worktree")
        self.assertEqual(payload["change_source"], "worktree")
        self.assertEqual(payload["change_class"], "light")
        self.assertEqual(payload["actual_files"], payload["change_packet"]["changed_files"])
        self.assertEqual(payload["change_evidence"]["observation_basis"]["sources_checked"], ["git_status"])

    def test_preflight_runs_task_guard_when_task_id_is_present(self) -> None:
        self.install_preflight_fixtures()
        self.init_git_repo()

        completed = self.run_script("scripts/coord/preflight.ts", "--taskId=task-999-sample")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["guard_level"], "task")
        self.assertEqual(payload["task_id"], "task-999-sample")
        self.assertIn("companion", payload)
        self.assertIn("runtime_check", payload)

    def test_pre_task_alias_matches_unified_preflight_output_shape(self) -> None:
        self.install_preflight_fixtures()
        self.init_git_repo()

        preflight = self.run_script("scripts/coord/preflight.ts", "--taskId=task-999-sample")
        shutil.rmtree(self.target / "agent-coordination", ignore_errors=True)
        shutil.rmtree(self.target / "output", ignore_errors=True)
        legacy = self.run_script("scripts/coord/check.ts", "pre-task", "--taskId=task-999-sample")
        preflight_payload = json.loads(preflight.stdout)
        legacy_payload = json.loads(legacy.stdout)

        self.assertEqual(preflight.returncode, 0, msg=preflight.stdout or preflight.stderr)
        self.assertEqual(legacy.returncode, 0, msg=legacy.stdout or legacy.stderr)
        self.assertEqual(preflight_payload["guard_level"], "task")
        self.assertEqual(legacy_payload["guard_level"], "task")
        self.assert_change_packet_aliases(preflight_payload)
        self.assert_change_packet_aliases(legacy_payload)
        self.assertEqual(preflight_payload["task_id"], legacy_payload["task_id"])
        self.assertEqual(preflight_payload["change_class"], legacy_payload["change_class"])
        self.assertEqual(preflight_payload["change_packet"], legacy_payload["change_packet"])
        self.assertEqual(sorted(preflight_payload["runtime_check"].keys()), sorted(legacy_payload["runtime_check"].keys()))
        self.assertEqual(sorted(preflight_payload["scope_check"].keys()), sorted(legacy_payload["scope_check"].keys()))

    def test_preflight_task_output_includes_retro_hints(self) -> None:
        self.install_preflight_fixtures()
        self.init_git_repo()

        self.run_node(
            f"""
const fs = require("node:fs");
const path = require("node:path");
const {{ ensureCompanion, updateCompanion }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
ensureCompanion("task-999-sample");
updateCompanion("task-999-sample", (companion) => {{
  companion.artifacts.iteration_digest = {{
    updated_at: "2026-03-21T00:00:00.000Z",
    attempt_count: 2,
    active_ms_by_stage: {{ review: 2000 }},
    wait_ms_by_stage: {{ review_wait: 9000 }},
    top_blockers: [
      {{
        signature: "preflight:工作区未清理",
        stage: "preflight",
        reason: "工作区未清理",
        repeat_count: 2,
        lost_time_ms: 5000,
        related_docs: ["AGENTS.md"],
        why_it_repeats: "task 合同和 worktree 没有先收口。",
        suggested_shortcut: "先单独提交 task 合同。",
        promotion_hint: "可升格成 runbook。",
      }}
    ],
    last_attempt: {{
      attempt_id: "attempt-1",
      started_at: "2026-03-21T00:00:00.000Z",
      ended_at: "2026-03-21T00:00:11.000Z",
      dominant_stage: "review_wait",
      dominant_blocker: "工作区未清理",
      summary: "主要耗时在 review_wait；主要阻塞是 工作区未清理",
    }},
    next_agent_hints: ["上一轮时间主要耗在 review_wait。"],
  }};
  return companion;
}});
const retroDir = path.join(process.cwd(), "output", "ai", "retro-candidates");
fs.mkdirSync(retroDir, {{ recursive: true }});
fs.writeFileSync(
  path.join(retroDir, "latest.json"),
  JSON.stringify({{
    ok: true,
    candidate_count: 1,
    candidates: [
      {{
        candidate_id: "retro-001-preflight",
        signature: "preflight:工作区未清理",
        repeat_count: 2,
        affected_tasks: ["t-999"],
        lost_time_ms: 5000,
        why_it_repeats: "task 合同和 worktree 没有先收口。",
        suggested_shortcut: "先单独提交 task 合同。",
        related_docs: ["AGENTS.md"],
        promotion_hint: "可升格成 runbook。",
      }}
    ],
  }}, null, 2)
);
console.log(JSON.stringify({{ ok: true }}));
"""
        )
        subprocess.run(["git", "add", "."], cwd=self.target, check=True)
        subprocess.run(["git", "commit", "-m", "seed retro context"], cwd=self.target, check=True)

        completed = self.run_script("scripts/coord/preflight.ts", "--taskId=task-999-sample")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertTrue(payload["iteration_digest_path"].endswith("agent-coordination/tasks/task-999-sample.json"))
        self.assertTrue(payload["retro_candidates_path"].endswith("output/ai/retro-candidates/latest.json"))
        self.assertTrue(any("review_wait" in hint for hint in payload["retro_hints"]))
        self.assertTrue(any("工作区未清理" in hint for hint in payload["retro_hints"]))
        self.assertTrue(any("shortcut" in hint for hint in payload["retro_hints"]))

    def test_coord_task_start_uses_unified_preflight_entry(self) -> None:
        self.install_preflight_fixtures()
        self.init_git_repo()

        completed = self.run_script("scripts/coord/task.ts", "start", "--taskId=task-999-sample")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["guard_level"], "task")
        self.assertEqual(payload["task_id"], "task-999-sample")

    def test_task_handoff_transitions_execution_into_review_wait(self) -> None:
        self.init_git_repo()
        self.run_node(
            f"""
const {{ ensureCompanion }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
const {{ startActiveStage }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-activity.ts");
ensureCompanion("task-999-sample");
startActiveStage("task-999-sample", "execution", {{
  source: "test:start",
}});
console.log(JSON.stringify({{ ok: true }}));
"""
        )

        completed = self.run_script("scripts/coord/task.ts", "handoff", "--taskId=task-999-sample")
        payload = json.loads(completed.stdout)
        activity = self.run_node(
            """
const fs = require("node:fs");
const path = require("node:path");
const dir = path.join(process.cwd(), "output", "agent_session", "task-activity", "task-999-sample");
const current = JSON.parse(fs.readFileSync(path.join(dir, "current.json"), "utf8"));
const trace = fs
  .readdirSync(dir)
  .filter((entry) => entry.endsWith(".jsonl"))
  .sort()
  .flatMap((entry) =>
    fs
      .readFileSync(path.join(dir, entry), "utf8")
      .trim()
      .split(/\\r?\\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  );
console.log(JSON.stringify({ current, trace }, null, 2));
"""
        )

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertEqual(activity["current"]["open_stage"]["stage"], "review_wait")
        self.assertEqual(activity["trace"][-2]["event_type"], "phase_finished")
        self.assertEqual(activity["trace"][-2]["stage"], "execution")
        self.assertEqual(activity["trace"][-1]["event_type"], "wait_started")
        self.assertEqual(activity["trace"][-1]["stage"], "review_wait")

    def test_validate_task_git_link_ignores_unchanged_historical_task_noise(self) -> None:
        scripts_dir = self.target / "scripts"
        scripts_dir.mkdir(parents=True, exist_ok=True)
        script_path = scripts_dir / "sample.ts"
        script_path.write_text("export const value = 1;\n", encoding="utf8")
        (self.target / "tasks" / "queue" / "task-123-historical.md").write_text(
            """# 历史任务

## 任务摘要

- 短编号：`t-123`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  一个未被本轮触碰的旧任务。
- 为什么现在：
  仅用于验证历史噪音不会污染本轮校验。
- 承接边界：
  不参与当前改动，只保留为历史任务样本。
- 完成定义：
  校验器应忽略未被触碰的历史任务噪音。

## 执行合同

### 要做

- 保留历史任务样本。

### 不做

- 不参与本轮实现。

### 约束

- 保持为静态历史噪音。

### 关键风险

- 若任务解析误判，历史任务可能混入当前校验。

### 测试策略

- 为什么测：确认校验器只关心本轮触碰任务。
- 测什么：结构性变更下的任务筛选。
- 不测什么：不验证历史任务本身的发布状态。
- 当前最小集理由：只锁住噪音过滤行为。

## 交付结果

- 状态：doing
- 体验验收结果：
  不适用
- 交付结果：
  作为旧任务噪音样本存在。
- 复盘：
  未复盘
""",
            encoding="utf8",
        )
        self.init_git_repo()
        subprocess.run(["git", "checkout", "-b", "codex/task-999-sample"], cwd=self.target, check=True)
        self.run_node(
            f"""
const {{ ensureCompanion }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
ensureCompanion("t-999");
console.log(JSON.stringify({{ ok: true }}));
"""
        )
        script_path.write_text("export const value = 2;\n", encoding="utf8")

        completed = self.run_script("scripts/ai/validate-task-git-link.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assert_change_packet_aliases(payload)
        self.assertEqual(payload["observation_mode"], "recent")
        self.assertEqual(payload["change_source"], "worktree")
        self.assertEqual(payload["change_class"], "structural")
        self.assertEqual(payload["changed_task_paths"], [])
        self.assertEqual(payload["validated_task_paths"], ["tasks/queue/task-999-sample.md"])
        self.assertEqual([task["path"] for task in payload["tasks"]], ["tasks/queue/task-999-sample.md"])

    def test_validate_change_trace_uses_recent_committed_structural_change_when_worktree_is_clean(self) -> None:
        scripts_dir = self.target / "scripts"
        scripts_dir.mkdir(parents=True, exist_ok=True)
        script_path = scripts_dir / "sample.ts"
        script_path.write_text("export const value = 1;\n", encoding="utf8")
        self.init_git_repo()
        script_path.write_text("export const value = 2;\n", encoding="utf8")
        subprocess.run(["git", "add", "scripts/sample.ts"], cwd=self.target, check=True)
        subprocess.run(["git", "commit", "-m", "recent structural change"], cwd=self.target, check=True)

        completed = self.run_script("scripts/ai/validate-change-trace.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertFalse(payload["ok"])
        self.assert_change_packet_aliases(payload)
        self.assertEqual(payload["observation_mode"], "recent")
        self.assertEqual(payload["change_source"], "recent_commit")
        self.assertEqual(payload["change_class"], "structural")
        self.assertEqual(payload["change_evidence"]["classification_rule"], "has_non_light_non_release_files")
        self.assertEqual(payload["change_evidence"]["observation_basis"]["sources_checked"], ["git_status", "head_parent_diff"])
        self.assertTrue(any("没有任何 tasks/queue/*.md 变更" in error for error in payload["errors"]))

    def test_release_cleanup_lifecycle_can_schedule_and_cancel(self) -> None:
        feature_sha = self.prepare_merged_sample_branch()
        payload = self.run_node(
            f"""
const fs = require("node:fs");
const {{
  recordReleaseCleanupCancellation,
  recordReleaseCleanupSchedule,
}} = require("{ROOT.as_posix()}/scripts/coord/lib/companion-lifecycle.ts");
const {{ getCompanionPath }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
recordReleaseCleanupSchedule("t-999", {{
  release_id: "rel-prod-1",
  commit_sha: "{feature_sha}",
  eligible_at: "2026-03-25T10:00:00.000Z",
  scheduled_for: "2026-03-26T10:00:00.000Z",
}});
recordReleaseCleanupCancellation("t-999", {{
  reason: "release_rolled_back",
}});
console.log(fs.readFileSync(getCompanionPath("t-999"), "utf8"));
"""
        )

        branch_cleanup = payload["artifacts"]["branch_cleanup"]
        self.assertEqual(branch_cleanup["trigger"], "prod_accepted")
        self.assertEqual(branch_cleanup["source_release_id"], "rel-prod-1")
        self.assertEqual(branch_cleanup["source_commit"], feature_sha)
        self.assertEqual(branch_cleanup["overall_state"], "canceled")
        self.assertEqual(branch_cleanup["local"]["state"], "canceled")
        self.assertEqual(branch_cleanup["remote"]["state"], "not_configured")
        self.assertEqual(branch_cleanup["canceled_reason"], "release_rolled_back")

    def test_branch_backfill_can_seed_legacy_cleanup_records(self) -> None:
        feature_sha = self.prepare_merged_sample_branch()
        completed = self.run_script("scripts/coord/branch-backfill.ts", "--apply", "--json")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["summary"]["candidates"], 1)
        self.assertEqual(payload["summary"]["applied"], 1)
        self.assertEqual(payload["tasks"][0]["branch_cleanup"]["trigger"], "legacy_merged")
        self.assertEqual(payload["tasks"][0]["branch_cleanup"]["source_commit"], feature_sha)
        self.assertEqual(payload["tasks"][0]["branch_cleanup"]["overall_state"], "scheduled")
        self.assertEqual(payload["tasks"][0]["branch_cleanup"]["remote"]["state"], "not_configured")

    def test_branch_cleanup_dry_run_keeps_companion_unchanged(self) -> None:
        self.prepare_merged_sample_branch()
        self.run_script("scripts/coord/branch-backfill.ts", "--apply", "--json")
        self.run_node(
            f"""
const fs = require("node:fs");
const {{ updateCompanion, getCompanionPath }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
updateCompanion("t-999", (companion) => {{
  companion.artifacts.branch_cleanup.scheduled_for = "2026-03-20T00:00:00.000Z";
  return companion;
}});
console.log(JSON.stringify(JSON.parse(fs.readFileSync(getCompanionPath("t-999"), "utf8")).artifacts.branch_cleanup));
"""
        )

        completed = self.run_script("scripts/coord/branch-cleanup.ts", "--dry-run", "--json")
        payload = json.loads(completed.stdout)
        companion = self.run_node(
            f"""
const fs = require("node:fs");
const {{ getCompanionPath }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
console.log(JSON.stringify(JSON.parse(fs.readFileSync(getCompanionPath("t-999"), "utf8")).artifacts.branch_cleanup));
"""
        )

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertTrue(payload["dry_run"])
        self.assertEqual(payload["summary"]["attempted"], 1)
        self.assertEqual(companion["overall_state"], "scheduled")
        self.assertEqual(companion["local"]["state"], "scheduled")

    def test_branch_cleanup_deletes_local_branch_when_due(self) -> None:
        self.prepare_merged_sample_branch()
        self.run_script("scripts/coord/branch-backfill.ts", "--apply", "--json")
        self.run_node(
            f"""
const {{ updateCompanion }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
updateCompanion("t-999", (companion) => {{
  companion.artifacts.branch_cleanup.scheduled_for = "2026-03-20T00:00:00.000Z";
  return companion;
}});
console.log(JSON.stringify({{ ok: true }}));
"""
        )

        completed = self.run_script("scripts/coord/branch-cleanup.ts", "--json")
        payload = json.loads(completed.stdout)
        branch_exists = subprocess.run(
            ["git", "show-ref", "--verify", "--quiet", "refs/heads/codex/task-999-sample"],
            cwd=self.target,
            capture_output=True,
            text=True,
        )
        companion = self.run_node(
            f"""
const fs = require("node:fs");
const {{ getCompanionPath }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
console.log(JSON.stringify(JSON.parse(fs.readFileSync(getCompanionPath("t-999"), "utf8")).artifacts.branch_cleanup));
"""
        )

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["summary"]["deleted"], 1)
        self.assertNotEqual(companion["local"]["deleted_at"], None)
        self.assertEqual(companion["overall_state"], "deleted")
        self.assertEqual(companion["remote"]["state"], "not_configured")
        self.assertNotEqual(branch_exists.returncode, 0)

    def test_branch_cleanup_marks_ambiguous_remote_target_as_failed(self) -> None:
        self.prepare_merged_sample_branch()
        origin_dir = self.target / "origin.git"
        backup_dir = self.target / "backup.git"
        subprocess.run(["git", "init", "--bare", origin_dir.as_posix()], cwd=self.target, check=True)
        subprocess.run(["git", "init", "--bare", backup_dir.as_posix()], cwd=self.target, check=True)
        subprocess.run(["git", "remote", "add", "origin", origin_dir.as_posix()], cwd=self.target, check=True)
        subprocess.run(["git", "remote", "add", "backup", backup_dir.as_posix()], cwd=self.target, check=True)
        subprocess.run(["git", "checkout", "codex/task-999-sample"], cwd=self.target, check=True)
        subprocess.run(["git", "push", "-u", "backup", "codex/task-999-sample"], cwd=self.target, check=True)
        subprocess.run(["git", "checkout", "main"], cwd=self.target, check=True)
        (self.target / "bootstrap" / "project_operator.yaml").write_text(
            """github_surface:
  enabled: true
  remote_name: origin
  default_branch: main
""",
            encoding="utf8",
        )
        self.run_script("scripts/coord/branch-backfill.ts", "--apply", "--json")
        self.run_node(
            f"""
const {{ updateCompanion }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
updateCompanion("t-999", (companion) => {{
  companion.artifacts.branch_cleanup.scheduled_for = "2026-03-20T00:00:00.000Z";
  return companion;
}});
console.log(JSON.stringify({{ ok: true }}));
"""
        )

        completed = self.run_script("scripts/coord/branch-cleanup.ts", "--json")
        payload = json.loads(completed.stdout)
        companion = self.run_node(
            f"""
const fs = require("node:fs");
const {{ getCompanionPath }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
console.log(JSON.stringify(JSON.parse(fs.readFileSync(getCompanionPath("t-999"), "utf8")).artifacts.branch_cleanup));
"""
        )

        self.assertEqual(completed.returncode, 1, msg=completed.stdout or completed.stderr)
        self.assertFalse(payload["ok"])
        self.assertEqual(companion["local"]["state"], "deleted")
        self.assertEqual(companion["remote"]["state"], "failed")
        self.assertEqual(companion["remote"]["error_code"], "ambiguous_remote_target")
        self.assertEqual(companion["overall_state"], "failed")


if __name__ == "__main__":
    unittest.main()
