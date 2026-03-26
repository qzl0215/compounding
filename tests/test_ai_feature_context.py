import json
import subprocess
import unittest

from tests.coord_support import ROOT


class FeatureContextCliTests(unittest.TestCase):
    def run_feature_context(self, *args: str) -> dict:
        completed = subprocess.run(
            ["node", "--experimental-strip-types", str(ROOT / "scripts/ai/feature-context.ts"), *args, "--json"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(completed.stdout)

    def test_home_surface_context_smoke(self) -> None:
        payload = self.run_feature_context("--surface=home")
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["target_surface"], "home")
        self.assertIn("portal", payload["related_modules"])
        self.assertIn("memory/project/roadmap.md", payload["must_read"])
        self.assertIn("project_judgement", payload)
        self.assertIn("default_flow", payload)
        self.assertTrue(payload["default_flow"]["entry_command"].startswith("pnpm ai:feature-context"))
        self.assertTrue(any(command.startswith("pnpm ai:find:summary") for command in payload["default_flow"]["summary_first_commands"]))
        self.assertTrue(any(command.startswith("pnpm ai:read:summary") for command in payload["default_flow"]["summary_first_commands"]))
        self.assertTrue(any(command.startswith("rg -n --hidden") for command in payload["default_flow"]["raw_fallback_commands"]))
        self.assertTrue(payload["project_judgement"]["recommendedSurface"]["href"].startswith("/"))

    def test_releases_route_context_smoke(self) -> None:
        payload = self.run_feature_context("--route=/releases")
        self.assertTrue(payload["ok"])
        self.assertIn("releases", payload["related_modules"])
        self.assertIn("delivery", payload["related_modules"])
        self.assertIn("docs/DEV_WORKFLOW.md", payload["must_read"])
        self.assertGreater(len(payload["required_checks"]), 0)
        self.assertGreater(len(payload["project_judgement"]["overallSummary"]), 0)
        self.assertIn("next_action", payload["default_flow"])

    def test_task_overlay_context_smoke(self) -> None:
        payload = self.run_feature_context("--taskPath=tasks/queue/task-066-feature-context-and-shared-state.md")
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["task_overlay"]["taskId"], "task-066-feature-context-and-shared-state")
        self.assertIn("tasks/queue/task-066-feature-context-and-shared-state.md", payload["must_read"])
        self.assertIn("tasks/queue/task-066-feature-context-and-shared-state.md", payload["likely_files"])
        self.assertIn("tasks/queue/task-066-feature-context-and-shared-state.md", payload["default_flow"]["entry_command"])
        self.assertTrue(any("t-066" in command for command in payload["default_flow"]["summary_first_commands"]))
