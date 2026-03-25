import json
import shutil
import subprocess
import unittest
from tests.coord_support import ROOT, CoordCliTestCase, SAMPLE_TASK_MARKDOWN


class CoordCliTests(CoordCliTestCase):

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
        self.assertEqual(payload["change_class"], "light")
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
        self.assertEqual(payload["change_class"], "structural")
        self.assertTrue(any("没有任何 tasks/queue/*.md 变更" in error for error in payload["errors"]))

    def test_preflight_uses_basic_guard_without_task_id(self) -> None:
        self.install_preflight_fixtures()
        self.init_git_repo()

        completed = self.run_script("scripts/coord/preflight.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["guard_level"], "basic")
        self.assertIsNone(payload["task_id"])
        self.assertEqual(payload["change_class"], "light")
        self.assertIn("preflight_check", payload)

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
        self.assertEqual(payload["guard_level"], "basic")
        self.assertEqual(payload["change_class"], "structural")
        self.assertTrue(any(item["step"] == "task_binding" for item in payload["blockers"]))

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
        self.assertEqual(preflight_payload["task_id"], legacy_payload["task_id"])
        self.assertEqual(preflight_payload["change_class"], legacy_payload["change_class"])
        self.assertEqual(sorted(preflight_payload["runtime_check"].keys()), sorted(legacy_payload["runtime_check"].keys()))
        self.assertEqual(sorted(preflight_payload["scope_check"].keys()), sorted(legacy_payload["scope_check"].keys()))

    def test_coord_task_start_uses_unified_preflight_entry(self) -> None:
        self.install_preflight_fixtures()
        self.init_git_repo()

        completed = self.run_script("scripts/coord/task.ts", "start", "--taskId=task-999-sample")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["guard_level"], "task")
        self.assertEqual(payload["task_id"], "task-999-sample")

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
        self.assertEqual(payload["change_class"], "structural")
        self.assertEqual(payload["changed_task_paths"], [])
        self.assertEqual(payload["validated_task_paths"], ["tasks/queue/task-999-sample.md"])
        self.assertEqual([task["path"] for task in payload["tasks"]], ["tasks/queue/task-999-sample.md"])


if __name__ == "__main__":
    unittest.main()
