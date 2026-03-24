import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ReleaseRegistryStateTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.runtime_root = Path(self.temp_dir.name)
        self.registry_path = self.runtime_root / "registry.json"

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def run_node(self, source: str) -> dict:
        env = os.environ.copy()
        env["AI_OS_RELEASE_ROOT"] = str(self.runtime_root)
        completed = subprocess.run(
            ["node", "--experimental-strip-types", "-e", source],
            cwd=ROOT,
            env=env,
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(completed.stdout)

    def test_repair_registry_clears_stale_pending_dev_after_prod_promotion(self) -> None:
        self.registry_path.write_text(
            json.dumps(
                {
                    "active_release_id": "rel-prod",
                    "pending_dev_release_id": "rel-dev",
                    "updated_at": "2026-03-25T10:00:00Z",
                    "releases": [
                        {
                            "release_id": "rel-dev",
                            "commit_sha": "3333333",
                            "tag": None,
                            "source_ref": "HEAD",
                            "channel": "dev",
                            "acceptance_status": "pending",
                            "preview_url": "http://127.0.0.1:3011",
                            "promoted_to_main_at": None,
                            "promoted_from_dev_release_id": None,
                            "created_at": "2026-03-25T09:00:00Z",
                            "status": "preview",
                            "build_result": "passed",
                            "smoke_result": "passed",
                            "cutover_at": None,
                            "rollback_from": None,
                            "release_path": "/tmp/rel-dev",
                            "change_summary": ["3333333 preview"],
                            "notes": [],
                        },
                        {
                            "release_id": "rel-prod",
                            "commit_sha": "3333333",
                            "tag": "release-rel-prod",
                            "source_ref": "main",
                            "channel": "prod",
                            "acceptance_status": "accepted",
                            "preview_url": None,
                            "promoted_to_main_at": None,
                            "promoted_from_dev_release_id": "rel-dev",
                            "created_at": "2026-03-25T09:30:00Z",
                            "status": "active",
                            "build_result": "passed",
                            "smoke_result": "passed",
                            "cutover_at": "2026-03-25T09:35:00Z",
                            "rollback_from": None,
                            "release_path": "/tmp/rel-prod",
                            "change_summary": ["3333333 promote"],
                            "notes": [],
                        },
                    ],
                },
                indent=2,
            )
            + "\n",
            encoding="utf8",
        )

        payload = self.run_node(
            """
const { repairRegistry, pendingDevRelease } = require("./scripts/release/registry.ts");
const repaired = repairRegistry();
console.log(JSON.stringify({
  pending: pendingDevRelease(repaired),
  registry: repaired
}, null, 2));
"""
        )

        dev_release = next(release for release in payload["registry"]["releases"] if release["release_id"] == "rel-dev")
        self.assertIsNone(payload["pending"])
        self.assertIsNone(payload["registry"]["pending_dev_release_id"])
        self.assertEqual(dev_release["acceptance_status"], "accepted")
        self.assertEqual(dev_release["promoted_to_main_at"], "2026-03-25T09:35:00Z")

    def test_repair_registry_preserves_real_pending_dev(self) -> None:
        self.registry_path.write_text(
            json.dumps(
                {
                    "active_release_id": "rel-prod",
                    "pending_dev_release_id": "rel-dev",
                    "updated_at": "2026-03-25T10:00:00Z",
                    "releases": [
                        {
                            "release_id": "rel-dev",
                            "commit_sha": "4444444",
                            "tag": None,
                            "source_ref": "HEAD",
                            "channel": "dev",
                            "acceptance_status": "pending",
                            "preview_url": "http://127.0.0.1:3011",
                            "promoted_to_main_at": None,
                            "promoted_from_dev_release_id": None,
                            "created_at": "2026-03-25T09:00:00Z",
                            "status": "preview",
                            "build_result": "passed",
                            "smoke_result": "passed",
                            "cutover_at": None,
                            "rollback_from": None,
                            "release_path": "/tmp/rel-dev",
                            "change_summary": ["4444444 preview"],
                            "notes": [],
                        },
                        {
                            "release_id": "rel-prod",
                            "commit_sha": "1111111",
                            "tag": "release-rel-prod",
                            "source_ref": "main",
                            "channel": "prod",
                            "acceptance_status": "accepted",
                            "preview_url": None,
                            "promoted_to_main_at": None,
                            "promoted_from_dev_release_id": None,
                            "created_at": "2026-03-25T08:30:00Z",
                            "status": "active",
                            "build_result": "passed",
                            "smoke_result": "passed",
                            "cutover_at": "2026-03-25T08:35:00Z",
                            "rollback_from": None,
                            "release_path": "/tmp/rel-prod",
                            "change_summary": ["1111111 prod"],
                            "notes": [],
                        },
                    ],
                },
                indent=2,
            )
            + "\n",
            encoding="utf8",
        )

        payload = self.run_node(
            """
const { repairRegistry, pendingDevRelease } = require("./scripts/release/registry.ts");
const repaired = repairRegistry();
console.log(JSON.stringify({
  pending: pendingDevRelease(repaired),
  registry: repaired
}, null, 2));
"""
        )

        self.assertEqual(payload["registry"]["pending_dev_release_id"], "rel-dev")
        self.assertEqual(payload["pending"]["release_id"], "rel-dev")
        self.assertEqual(payload["pending"]["acceptance_status"], "pending")


if __name__ == "__main__":
    unittest.main()
