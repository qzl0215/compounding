import json
import unittest

from tests.coord_support import CoordCliTestCase, ROOT


class HarnessCliTests(CoordCliTestCase):
    def test_create_task_materializes_intent_contract_and_snapshot(self) -> None:
        created = self.run_script(
            "scripts/ai/create-task.ts",
            "task-123-harness",
            "统一控制面入口",
            "避免任务、发布和运行态继续各讲各的故事",
        )

        self.assertEqual(created.returncode, 0, msg=created.stdout or created.stderr)

        status = self.run_script("scripts/harness/status.ts")
        self.assertEqual(status.returncode, 0, msg=status.stdout or status.stderr)
        payload = json.loads(status.stdout)
        self.assertEqual(payload["active_contract"]["task_id"], "task-123-harness")
        self.assertEqual(payload["active_intent"]["task_id"], "task-123-harness")
        self.assertEqual(payload["next_action"]["action_id"], "run_preflight")

        events = self.run_script("scripts/harness/events.ts")
        event_payload = json.loads(events.stdout)
        self.assertEqual([item["event_type"] for item in event_payload["events"]], ["intent.created", "contract.materialized"])

    def test_task_transition_updates_harness_workflow_and_next_action(self) -> None:
        created = self.run_script(
            "scripts/ai/create-task.ts",
            "task-124-harness",
            "让状态迁移只认控制面",
            "需要确保旧 transition 写路径也会更新 live snapshot",
        )
        self.assertEqual(created.returncode, 0, msg=created.stdout or created.stderr)

        payload = self.run_node(
            f"""
const {{ applyTaskTransition }} = require("{ROOT.as_posix()}/scripts/coord/lib/task-machine.ts");
const {{ readHarnessSnapshot }} = require("{ROOT.as_posix()}/scripts/harness/lib.ts");
applyTaskTransition("t-124", "plan_approved", {{ source: "test" }});
applyTaskTransition("t-124", "preflight_passed", {{ source: "test", change_class: "structural" }});
console.log(JSON.stringify(readHarnessSnapshot()));
"""
        )

        self.assertEqual(payload["state"]["workflow"]["state_id"], "executing")
        self.assertEqual(payload["next_action"]["action_id"], "create_handoff")


if __name__ == "__main__":
    unittest.main()
