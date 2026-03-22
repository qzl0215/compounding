import json
import subprocess
import unittest
from tests.coord_support import ROOT, CoordCliTestCase


class CoordCliTests(CoordCliTestCase):

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
}} = require("{script_root}/scripts/coord/lib/companion-lifecycle.ts");
ensureCompanion("t-999");
recordCreated("t-999", {{ source: "test:create" }});
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
  delivery_summary: "t-999 示例任务",
  delivery_benefit: "benefit",
  delivery_risks: "risk",
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
        self.assertTrue(companion["human_decision_needed"] is False)
        self.assertEqual(companion["artifacts"]["decision_cards"][-1]["decision_id"], "dec-test")
        self.assertEqual(companion["artifacts"]["diff_summaries"][-1]["path"], "agent-coordination/reports/diff-summary-main-head.json")
        self.assertNotIn("branch_name", raw)
        self.assertNotIn("planned_files", raw)
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
  delivery_summary: "t-999 companion summary",
  delivery_benefit: "benefit from companion",
  delivery_risks: "risk from companion",
  preview_url: "http://127.0.0.1:3011",
  status: "preview"
}});
console.log(JSON.stringify(readCompanionReleaseContext("t-999"), null, 2));
"""
        )

        self.assertEqual(payload["delivery_summary"], "t-999 companion summary")
        self.assertEqual(payload["delivery_benefit"], "benefit from companion")
        self.assertEqual(payload["delivery_risks"], "risk from companion")

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

    def test_pre_task_skips_for_light_changes_without_task_id(self) -> None:
        docs_dir = self.target / "docs"
        docs_dir.mkdir(parents=True, exist_ok=True)
        doc_path = docs_dir / "notes.md"
        doc_path.write_text("# Notes\n\ninitial\n", encoding="utf8")
        self.init_git_repo()
        doc_path.write_text("# Notes\n\nupdated\n", encoding="utf8")

        completed = self.run_script("scripts/coord/check.ts", "pre-task")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertTrue(payload["skipped"])
        self.assertEqual(payload["change_class"], "light")

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
