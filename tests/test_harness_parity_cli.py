import json
import subprocess
import unittest

from tests.coord_support import ROOT


class HarnessParityCliTests(unittest.TestCase):
    def run_script(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["node", "--experimental-strip-types", str(ROOT / "scripts" / "harness" / "check-parity.ts"), *args],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_parity_checker_passes_without_running_commands(self) -> None:
        result = self.run_script()
        self.assertEqual(result.returncode, 0, msg=result.stdout or result.stderr)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(
            payload["selected_scenarios"],
            [
                "intent_contract_materialization",
                "workflow_transition_updates_next_action",
                "studio_harness_status_parse",
                "orchestration_shared_snapshot",
            ],
        )

    def test_parity_diff_reports_coverage(self) -> None:
        result = self.run_script("--diff")
        self.assertEqual(result.returncode, 0, msg=result.stdout or result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["mode"], "diff")
        self.assertIn("openspec/specs/harness/spec.md", payload["coverage"]["reference_paths"])
        self.assertIn(
            "apps/studio/src/modules/orchestration/__tests__/service.test.ts",
            payload["coverage"]["verification_paths"],
        )


if __name__ == "__main__":
    unittest.main()
