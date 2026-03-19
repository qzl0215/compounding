import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class CoordCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.target = Path(self.temp_dir.name)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "shared").mkdir(parents=True, exist_ok=True)
        (self.target / "bootstrap").mkdir(parents=True, exist_ok=True)
        shutil.copy(ROOT / "shared" / "task-identity.ts", self.target / "shared" / "task-identity.ts")
        shutil.copy(ROOT / "bootstrap" / "heading_aliases.json", self.target / "bootstrap" / "heading_aliases.json")
        (self.target / "tasks" / "queue" / "task-999-sample.md").write_text(
            """# 示例任务

## 短编号

t-999

## 目标

验证 companion lifecycle。

## 关联模块

- `scripts/coord/task.ts`
- `tasks/queue/task-999-sample.md`

## 当前模式

工程执行

## 分支

`codex/task-999-sample`

## 交付收益

让 review 与 release 可以复用同一份 companion。

## 交付风险

若 contract 漂移，会重新长出第二套状态表。

## 状态

doing
""",
            encoding="utf8",
        )

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def run_node(self, code: str) -> dict:
        completed = subprocess.run(
            ["node", "--experimental-strip-types", "-e", code],
            cwd=self.target,
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(completed.stdout)

    def test_companion_lifecycle_records_pre_task_review_and_release_handoff(self) -> None:
        script_root = ROOT.as_posix()
        payload = self.run_node(
            f"""
const {{ ensureCompanion, readCompanion }} = require("{script_root}/scripts/coord/lib/task-meta.ts");
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
console.log(JSON.stringify(readCompanion("t-999"), null, 2));
"""
        )

        self.assertEqual(payload["companion_phase"], "released")
        self.assertEqual(payload["lifecycle"]["handoff"]["summary"], "handoff summary")
        self.assertEqual(payload["lifecycle"]["review"]["merge_decision"], "auto_merge")
        self.assertEqual(payload["lifecycle"]["release_handoff"]["release_id"], "20260320-abc-prod")
        self.assertTrue(payload["human_decision_needed"] is False)
        self.assertEqual(payload["artifacts"]["decision_cards"][-1]["decision_id"], "dec-test")
        self.assertEqual(payload["artifacts"]["diff_summaries"][-1]["path"], "agent-coordination/reports/diff-summary-main-head.json")

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


if __name__ == "__main__":
    unittest.main()
