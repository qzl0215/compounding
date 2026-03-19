import json
import os
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

from scripts.compounding_bootstrap.engine import (
    AGENTS_PATH,
    apply_proposal,
    audit,
    baseline_commit_suggestion,
    create_proposal,
    load_yaml,
    migrate_legacy_config,
    scaffold,
    validate_config_file,
)
from scripts.compounding_bootstrap.proposal_generation import resolve_provider_config


ROOT = Path(__file__).resolve().parents[1]


class BootstrapCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.target = Path(self.temp_dir.name)
        shutil.copytree(ROOT / "bootstrap", self.target / "bootstrap")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    @property
    def brief_path(self) -> Path:
        return self.target / "bootstrap" / "project_brief.yaml"

    def test_scaffold_and_audit_pass(self) -> None:
        scaffold(self.brief_path, self.target)
        result = audit(self.brief_path, self.target)

        self.assertTrue(result.passed, msg=result.errors)
        self.assertTrue((self.target / AGENTS_PATH).exists())
        self.assertTrue((self.target / "docs" / "PROJECT_RULES.md").exists())
        self.assertTrue((self.target / "docs" / "ORG_MODEL.md").exists())
        self.assertTrue((self.target / "memory" / "project" / "current-state.md").exists())
        self.assertTrue((self.target / "memory" / "project" / "operating-blueprint.md").exists())
        self.assertTrue((self.target / "code_index" / "module-index.md").exists())
        self.assertTrue((self.target / "tasks" / "queue" / "task-001-repo-refactor.md").exists())
        self.assertTrue((self.target / "scripts" / "ai" / "scan-code-health.ts").exists())
        self.assertTrue((self.target / "output" / "bootstrap" / "project_bootstrap.resolved.yaml").exists())

    def test_scaffold_sets_self_owned_truth_for_roadmap_and_current_state(self) -> None:
        scaffold(self.brief_path, self.target)
        roadmap = (self.target / "memory" / "project" / "roadmap.md").read_text(encoding="utf8")
        current_state = (self.target / "memory" / "project" / "current-state.md").read_text(encoding="utf8")

        self.assertIn("source_of_truth: memory/project/roadmap.md", roadmap)
        self.assertIn("source_of_truth: memory/project/current-state.md", current_state)

    def test_scaffold_preserves_manual_notes(self) -> None:
        scaffold(self.brief_path, self.target)
        doc_path = self.target / AGENTS_PATH
        original = doc_path.read_text(encoding="utf8")
        updated = original + "\n人工追加笔记：不要覆盖我。\n"
        doc_path.write_text(updated, encoding="utf8")

        scaffold(self.brief_path, self.target)
        after = doc_path.read_text(encoding="utf8")

        self.assertIn("人工追加笔记：不要覆盖我。", after)
        self.assertIn("BEGIN MANAGED BLOCK: CANONICAL_CONTENT", after)

    def test_scaffold_is_idempotent(self) -> None:
        scaffold(self.brief_path, self.target)
        snapshot = {
            path.relative_to(self.target).as_posix(): path.read_text(encoding="utf8")
            for path in self.target.rglob("*")
            if path.is_file()
        }

        scaffold(self.brief_path, self.target)
        after = {
            path.relative_to(self.target).as_posix(): path.read_text(encoding="utf8")
            for path in self.target.rglob("*")
            if path.is_file()
        }

        self.assertEqual(snapshot, after)

    def test_audit_rejects_agents_roadmap_priority_drift(self) -> None:
        scaffold(self.brief_path, self.target)
        agents_path = self.target / AGENTS_PATH
        agents_text = agents_path.read_text(encoding="utf8")
        current_priority_line = next(line for line in agents_text.splitlines() if line.startswith("- 当前优先级："))
        agents_path.write_text(
            agents_text.replace(current_priority_line, "- 当前优先级：已经偏离 roadmap 的错误值。"),
            encoding="utf8",
        )

        result = audit(self.brief_path, self.target)

        self.assertFalse(result.passed)
        self.assertTrue(any("AGENTS current priority must mirror roadmap current priority." in item for item in result.errors))

    def test_audit_rejects_legacy_live_docs_and_missing_experience_section(self) -> None:
        scaffold(self.brief_path, self.target)
        legacy_reference = self.target / "docs" / "reference"
        legacy_reference.mkdir(parents=True, exist_ok=True)
        (legacy_reference / "stale.md").write_text("stale", encoding="utf8")
        experience_path = self.target / "memory" / "experience" / "README.md"
        experience_path.write_text(
            experience_path.read_text(encoding="utf8").replace("## 升格候选", "## Candidates"),
            encoding="utf8",
        )

        result = audit(self.brief_path, self.target)

        self.assertFalse(result.passed)
        self.assertTrue(any("Legacy live docs path still exists: docs/reference" in item for item in result.errors))
        self.assertTrue(any("memory/experience/README.md missing section: ## 升格候选" in item for item in result.errors))

    def test_validate_config_file_passes(self) -> None:
        result = validate_config_file(self.brief_path, self.target)
        self.assertTrue(result["ok"], msg=result)
        self.assertEqual(result["field_errors"], {})

    def test_validate_config_file_fails_for_invalid_enum(self) -> None:
        invalid = self.brief_path.read_text(encoding="utf8").replace("runtime_boundary: server-only", "runtime_boundary: invalid")
        self.brief_path.write_text(invalid, encoding="utf8")

        result = validate_config_file(self.brief_path, self.target)

        self.assertFalse(result["ok"])
        self.assertIn("runtime_boundary", result["field_errors"])

    def test_migrate_legacy_config_writes_brief(self) -> None:
        self.brief_path.unlink()
        migrated = migrate_legacy_config(self.target)
        payload = load_yaml(migrated)

        self.assertEqual(migrated, self.brief_path)
        self.assertIn("success_definition", payload)
        self.assertIn("must_protect", payload)

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

        subprocess.run(["git", "init"], cwd=self.target, check=True)
        subprocess.run(["git", "config", "user.name", "AI Operating System"], cwd=self.target, check=True)
        subprocess.run(["git", "config", "user.email", "ai-os@local"], cwd=self.target, check=True)
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
        subprocess.run(["git", "init"], cwd=self.target, check=True)
        subprocess.run(["git", "config", "user.name", "AI Operating System"], cwd=self.target, check=True)
        subprocess.run(["git", "config", "user.email", "ai-os@local"], cwd=self.target, check=True)
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
