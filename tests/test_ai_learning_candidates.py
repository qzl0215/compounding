import json
from pathlib import Path

from tests.coord_support import CoordCliTestCase, ROOT, render_task_template


class LearningCandidatesCliTests(CoordCliTestCase):
    def test_learning_candidates_cli_emits_current_task_hints_and_files(self) -> None:
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
    active_ms_by_stage: {{ preflight: 120000 }},
    wait_ms_by_stage: {{}},
    top_blockers: [
      {{
        signature: "preflight:工作区未清理",
        stage: "preflight",
        reason: "工作区未清理",
        repeat_count: 2,
        lost_time_ms: 120000,
        last_seen_at: "2026-03-21T00:00:00.000Z",
        related_docs: ["AGENTS.md"],
        why_it_repeats: "task 合同和 worktree 没有先收口。",
        suggested_shortcut: "先单独提交 task 合同。",
        promotion_hint: "可升格成 runbook。",
      }}
    ],
    last_attempt: {{
      attempt_id: "attempt-1",
      started_at: "2026-03-21T00:00:00.000Z",
      ended_at: "2026-03-21T00:02:00.000Z",
      dominant_stage: "preflight",
      dominant_blocker: "工作区未清理",
      summary: "主要耗时在 preflight；主要阻塞是 工作区未清理",
    }},
    next_agent_hints: ["上一轮时间主要耗在 preflight。"],
  }};
  return companion;
}});
const gainDir = path.join(process.cwd(), "output", "ai", "command-gain");
fs.mkdirSync(gainDir, {{ recursive: true }});
fs.writeFileSync(
  path.join(gainDir, "events.jsonl"),
  [
    JSON.stringify({{
      event_kind: "summary_run",
      timestamp: "2026-03-21T00:01:00.000Z",
      task_id: "t-999",
      shortcut_id: "preflight_summary",
      original_cmd: "pnpm ai:preflight:summary -- --taskId=t-999",
      input_tokens_est: 1200,
      output_tokens_est: 200,
      saved_tokens_est: 1000,
      savings_pct_est: 83.3,
      exec_time_ms: 1000,
      exit_code: 0,
      profile_id: "preflight_summary",
    }}),
    JSON.stringify({{
      event_kind: "shortcut_opportunity",
      timestamp: "2026-03-21T00:02:00.000Z",
      task_id: "t-999",
      shortcut_id: "preflight_summary",
      original_cmd: "pnpm preflight -- --taskId=t-999",
      adopted: false,
      exit_code: 0,
      profile_id: "preflight_summary",
    }}),
    JSON.stringify({{
      event_kind: "shortcut_opportunity",
      timestamp: "2026-03-21T00:03:00.000Z",
      task_id: "t-999",
      shortcut_id: "preflight_summary",
      original_cmd: "pnpm preflight -- --taskId=t-999",
      adopted: false,
      exit_code: 0,
      profile_id: "preflight_summary",
    }}),
  ].join("\\n") + "\\n",
  "utf8",
);
console.log(JSON.stringify({{ ok: true }}));
"""
        )

        completed = self.run_script("scripts/ai/learning-candidates.ts", "--taskId=task-999-sample", "--json")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertTrue(Path(payload["json_path"]).exists())
        self.assertGreaterEqual(len(payload["current_task"]["hints"]), 2)
        self.assertTrue(any(item["kind"] == "execution_blocker" for item in payload["current_task"]["hints"]))
        self.assertTrue(any(item["kind"] == "shortcut_gap" for item in payload["current_task"]["hints"]))

    def test_learning_candidates_promotes_cross_task_candidate_when_roi_threshold_hit(self) -> None:
        self.init_git_repo()
        second_task = self.target / "tasks" / "queue" / "task-998-sample.md"
        second_task.write_text(
            render_task_template(
                {
                    "task_id": "task-998-sample",
                    "short_id": "t-998",
                    "summary": "验证跨 task promotion queue。",
                    "branch": "codex/task-998-sample",
                }
            ),
            encoding="utf8",
        )
        self.run_node(
            f"""
const {{ ensureCompanion, updateCompanion }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-meta.ts");
for (const taskId of ["task-999-sample", "task-998-sample"]) {{
  ensureCompanion(taskId);
  updateCompanion(taskId, (companion) => {{
    companion.artifacts.iteration_digest = {{
      updated_at: "2026-03-21T00:00:00.000Z",
      attempt_count: 2,
      active_ms_by_stage: {{ review_wait: 420000 }},
      wait_ms_by_stage: {{}},
      top_blockers: [
        {{
          signature: "review_wait:test_reviewer",
          stage: "review_wait",
          reason: "test_reviewer",
          repeat_count: 2,
          lost_time_ms: 420000,
          last_seen_at: "2026-03-21T00:00:00.000Z",
          related_docs: ["docs/DEV_WORKFLOW.md"],
          why_it_repeats: "review 前没有先压缩高频检查。",
          suggested_shortcut: "先走 review_summary，再回退 raw。",
          promotion_hint: "可升格成 planning item。",
        }}
      ],
      last_attempt: {{
        attempt_id: "attempt-1",
        started_at: "2026-03-21T00:00:00.000Z",
        ended_at: "2026-03-21T00:07:00.000Z",
        dominant_stage: "review_wait",
        dominant_blocker: "test_reviewer",
        summary: "主要耗时在 review_wait；主要阻塞是 test_reviewer",
      }},
      next_agent_hints: ["上一轮时间主要耗在 review_wait。"],
    }};
    return companion;
  }});
}}
console.log(JSON.stringify({{ ok: true }}));
"""
        )

        completed = self.run_script("scripts/ai/learning-candidates.ts", "--json")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertTrue(any(item["promotion_ready"] for item in payload["candidates"]))
        self.assertGreaterEqual(len(payload["promotion_queue"]), 1)
        self.assertEqual(payload["promotion_queue"][0]["promotion_semantics"], "blueprint_then_task")
        self.assertEqual(payload["promotion_queue"][0]["suggested_target"], "operating-blueprint")


if __name__ == "__main__":
    import unittest

    unittest.main()
