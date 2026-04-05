from __future__ import annotations

import json
import subprocess
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class DerivedAssetContractTests(unittest.TestCase):
    def run_validator(self) -> dict[str, object]:
        result = subprocess.run(
            ["node", "--experimental-strip-types", str(ROOT / "scripts" / "ai" / "validate-derived-asset-contract.ts")],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(result.stdout)

    def test_validator_reports_expected_families(self) -> None:
        payload = self.run_validator()
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["details"]["family_ids"], ["code_index", "output", "coordination", "runtime"])
        self.assertEqual(payload["details"]["truth_roles"]["code_index"], "derived")
        self.assertEqual(payload["details"]["truth_roles"]["output"], "transient")
        self.assertIn("output/", payload["details"]["observation_ignored_prefixes"])
        self.assertIn("agent-coordination/", payload["details"]["observation_ignored_prefixes"])
        self.assertIn(".compounding-runtime/", payload["details"]["observation_ignored_prefixes"])
