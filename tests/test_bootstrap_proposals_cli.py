import json
import os
import subprocess
import unittest
from unittest.mock import patch

from scripts.compounding_bootstrap.engine import (
    AGENTS_PATH,
    apply_proposal,
    baseline_commit_suggestion,
    create_proposal,
    scaffold,
)
from scripts.compounding_bootstrap.proposal_generation import resolve_provider_config
from tests.bootstrap_support import ROOT, BootstrapWorkspaceTestCase


class BootstrapProposalCliTests(BootstrapWorkspaceTestCase):
    def test_propose_and_apply(self) -> None:
        scaffold(self.brief_path, self.target)
        prompt_file = self.target / "prompt.md"
        prompt_file.write_text("把 AGENTS 里的成功定义写得更清楚，并强化 review 规则。", encoding="utf8")

        proposal_id = create_proposal(self.brief_path, self.target, prompt_file)
        proposal_root = self.target / "output" / "proposals" / proposal_id
        metadata_path = proposal_root / "metadata.json"
        metadata = json.loads(metadata_path.read_text(encoding="utf8"))

        self.assertEqual(metadata["status"], "pending")
        self.assertEqual(metadata["action_type"], "canonical_update")
        self.assertGreater(len(metadata["target_blocks"]), 0)
        self.assertTrue((proposal_root / "diff.patch").exists())
        self.assertIn("generation_provider", metadata)
        self.assertIn("generation_model", metadata)
        self.assertIn("generation_providers", metadata["validation_summary"])

        with self.assertRaisesRegex(ValueError, "Baseline commit required"):
            apply_proposal(self.target, proposal_id)

        self.init_git_repo()
        subprocess.run(["git", "add", "."], cwd=self.target, check=True)
        subprocess.run(["git", "commit", "-m", baseline_commit_suggestion().split('"')[1]], cwd=self.target, check=True)

        proposal_id = create_proposal(self.brief_path, self.target, prompt_file)
        proposal_root = self.target / "output" / "proposals" / proposal_id
        metadata_path = proposal_root / "metadata.json"
        apply_proposal(self.target, proposal_id)

        updated_metadata = json.loads(metadata_path.read_text(encoding="utf8"))
        self.assertEqual(updated_metadata["status"], "applied")

        git_log = subprocess.check_output(
            ["git", "log", "--max-count=1", "--pretty=%s"],
            cwd=self.target,
            text=True,
        ).strip()
        self.assertIn(proposal_id, git_log)

        with self.assertRaises(ValueError):
            apply_proposal(self.target, proposal_id)

    def test_apply_proposal_rejects_dirty_worktree(self) -> None:
        scaffold(self.brief_path, self.target)
        self.init_git_repo()
        subprocess.run(["git", "add", "."], cwd=self.target, check=True)
        subprocess.run(["git", "commit", "-m", baseline_commit_suggestion().split('"')[1]], cwd=self.target, check=True)

        prompt_file = self.target / "prompt.md"
        prompt_file.write_text("补一条更适合小白的 review 说明。", encoding="utf8")
        proposal_id = create_proposal(self.brief_path, self.target, prompt_file)

        doc_path = self.target / AGENTS_PATH
        doc_path.write_text(doc_path.read_text(encoding="utf8") + "\nmanual dirty change\n", encoding="utf8")

        with self.assertRaisesRegex(ValueError, "worktree is dirty"):
            apply_proposal(self.target, proposal_id)

    def test_pre_mutation_check_outputs_json(self) -> None:
        scaffold(self.brief_path, self.target)
        subprocess.run(["git", "init"], cwd=self.target, check=True)
        completed = subprocess.run(
            ["python3", str(ROOT / "scripts" / "pre_mutation_check.py")],
            cwd=self.target,
            check=True,
            capture_output=True,
            text=True,
        )
        payload = json.loads(completed.stdout)

        self.assertIn("branch", payload)
        self.assertIn("head_sha", payload)
        self.assertIn("sync_status", payload)
        self.assertIn("next_action", payload)

    def test_resolve_provider_config_supports_volcano_aliases(self) -> None:
        file_env = {
            "VOLCANO_API_KEY": "ark-key",
            "MODEL_NAME": "ark-model",
            "VOLCANO_BASE_URL": "https://volcano.example/v1",
        }

        with patch.dict(os.environ, {}, clear=True):
            payload = resolve_provider_config(file_env)

        self.assertEqual(payload["provider"], "ark-openai-compatible")
        self.assertEqual(payload["api_key"], "ark-key")
        self.assertEqual(payload["model"], "ark-model")
        self.assertEqual(payload["base_url"], "https://volcano.example/v1")

    def test_release_lib_write_manifest_creates_parent_directory(self) -> None:
        script = """
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "compounding-release-"));
process.env.AI_OS_RELEASE_ROOT = runtimeRoot;
const { writeManifest, readManifest } = require("./scripts/release/lib.ts");
const record = {
  release_id: "sample-dev-release",
  commit_sha: "abc1234",
  source_ref: "HEAD",
  channel: "dev",
  acceptance_status: "pending",
  preview_url: "http://127.0.0.1:3011",
  promoted_to_main_at: null,
  promoted_from_dev_release_id: null,
  created_at: "2026-03-17T00:00:00.000Z",
  status: "preview",
  build_result: "passed",
  smoke_result: "passed",
  cutover_at: null,
  rollback_from: null,
  release_path: "/tmp/sample",
  change_summary: [],
  notes: []
};
writeManifest(record);
const manifest = readManifest(record.release_id);
console.log(JSON.stringify({ ok: manifest.release_id === record.release_id && fs.existsSync(path.join(runtimeRoot, "releases", record.release_id, "release-manifest.json")) }));
"""
        completed = subprocess.run(
            ["node", "--experimental-strip-types", "-e", script],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        payload = json.loads(completed.stdout)
        self.assertTrue(payload["ok"])

    def test_release_lib_resolves_short_task_id(self) -> None:
        script = """
const { readTaskDeliveryMetadata } = require("./scripts/release/lib.ts");
console.log(JSON.stringify(readTaskDeliveryMetadata("t-001")));
"""
        completed = subprocess.run(
            ["node", "--experimental-strip-types", "-e", script],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["id"], "task-001-repo-refactor")
        self.assertEqual(payload["short_id"], "t-001")

    def test_local_runtime_lib_exports_profile_label(self) -> None:
        script = """
process.env.AI_OS_RUNTIME_PROFILE = "dev";
const runtime = require("./scripts/local-runtime/lib.ts");
console.log(JSON.stringify({ profileLabel: runtime.PROFILE_LABEL || null }));
"""
        completed = subprocess.run(
            ["node", "--experimental-strip-types", "-e", script],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        payload = json.loads(completed.stdout)
        self.assertEqual(payload["profileLabel"], "dev 预览")


if __name__ == "__main__":
    unittest.main()
