import json
import subprocess
import unittest
from pathlib import Path

from tests.coord_support import ROOT


class ContextRetroCliTests(unittest.TestCase):
    def test_context_retro_cli_emits_weekly_report_and_files(self) -> None:
        completed = subprocess.run(
            [
                "node",
                "--experimental-strip-types",
                str(ROOT / "scripts/ai/context-retro.ts"),
                "--window=7d",
                "--json",
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        payload = json.loads(completed.stdout)

        self.assertTrue(payload["ok"])
        self.assertEqual(payload["window"], "7d")
        self.assertIn("top_lost_time_stages", payload)
        self.assertIn("top_missed_shortcuts", payload)
        self.assertIn("promotion_candidates", payload)
        self.assertTrue(Path(payload["json_path"]).exists())
        self.assertTrue(Path(payload["markdown_path"]).exists())


if __name__ == "__main__":
    unittest.main()
