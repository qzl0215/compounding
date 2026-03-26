import json
import os
import subprocess
import unittest
from unittest.mock import patch

from scripts.compounding_bootstrap.bootstrap import bootstrap
from scripts.compounding_bootstrap.proposal import apply_proposal, create_proposal
from scripts.compounding_bootstrap.proposal_generation import resolve_provider_config
from scripts.compounding_bootstrap.yaml_io import load_yaml
from tests.bootstrap_support import ROOT, BootstrapWorkspaceTestCase


class BootstrapProposalCliTests(BootstrapWorkspaceTestCase):
    def test_kernel_proposal_generates_yaml(self) -> None:
        bootstrap(self.brief_path, self.target)

        proposal_id = create_proposal(self.target)
        proposal_path = self.target / "output" / "proposals" / proposal_id / "proposal.yaml"
        payload = load_yaml(proposal_path)

        self.assertEqual(payload["proposal_id"], proposal_id)
        self.assertEqual(payload["bootstrap_mode"], "cold_start")
        self.assertEqual(payload["required_packs"], ["protocol_pack", "operator_pack", "tooling_pack"])
        self.assertIn("changes", payload)
        self.assertIn("proposal_required", payload["changes"])
        self.assertTrue(proposal_path.exists())

    def test_proposal_blocks_runtime_and_business_paths(self) -> None:
        bootstrap(self.brief_path, self.target)
        (self.target / "apps" / "web").mkdir(parents=True, exist_ok=True)
        (self.target / "apps" / "web" / "index.ts").write_text("export const app = true;\n", encoding="utf8")
        (self.target / "scripts" / "release").mkdir(parents=True, exist_ok=True)
        (self.target / "scripts" / "release" / "main.ts").write_text("export const release = true;\n", encoding="utf8")

        proposal_id = create_proposal(self.target)
        proposal_path = self.target / "output" / "proposals" / proposal_id / "proposal.yaml"
        payload = load_yaml(proposal_path)

        self.assertIn("apps/**", payload["changes"]["blocked"])
        self.assertIn("scripts/release/**", payload["changes"]["blocked"])

    def test_apply_proposal_copies_only_auto_apply_assets(self) -> None:
        (self.target / "memory" / "project").mkdir(parents=True, exist_ok=True)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "README.md").write_text("# Legacy Repo\n\nlegacy app\n", encoding="utf8")
        subprocess.run(
            ["python3", str(ROOT / "scripts" / "init_project_compounding.py"), "attach", "--target", str(self.target)],
            check=True,
            capture_output=True,
            text=True,
        )
        self.init_git_repo()
        subprocess.run(["git", "add", "."], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "commit", "-m", "baseline"], cwd=self.target, check=True, capture_output=True, text=True)

        proposal_id = create_proposal(self.target)
        proposal_path = self.target / "output" / "proposals" / proposal_id / "proposal.yaml"
        payload = load_yaml(proposal_path)

        self.assertIn("schemas/project_brief.schema.yaml", payload["changes"]["auto_apply"])
        self.assertIn("kernel/kernel_manifest.yaml", payload["changes"]["auto_apply"])
        self.assertIn("docs/WORK_MODES.md", payload["changes"]["auto_apply"])
        self.assertIn("AGENTS.md", payload["changes"]["proposal_required"])

        result = apply_proposal(self.target, proposal_id)

        self.assertEqual(result["status"], "applied")
        self.assertTrue((self.target / "schemas" / "project_brief.schema.yaml").exists())
        self.assertTrue((self.target / "kernel" / "kernel_manifest.yaml").exists())
        self.assertTrue((self.target / "docs" / "WORK_MODES.md").exists())
        self.assertIn("title: WORK_MODES", (self.target / "docs" / "WORK_MODES.md").read_text(encoding="utf8"))
        self.assertFalse((self.target / "AGENTS.md").exists())

    def test_proposal_moves_existing_task_template_diff_to_proposal_required(self) -> None:
        (self.target / "memory" / "project").mkdir(parents=True, exist_ok=True)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "tasks" / "templates").mkdir(parents=True, exist_ok=True)
        (self.target / "tasks" / "templates" / "task-template.md").write_text("# local template\n", encoding="utf8")
        (self.target / "README.md").write_text("# Legacy Repo\n\nlegacy app\n", encoding="utf8")

        subprocess.run(
            ["python3", str(ROOT / "scripts" / "init_project_compounding.py"), "attach", "--target", str(self.target)],
            check=True,
            capture_output=True,
            text=True,
        )

        proposal_id = create_proposal(self.target)
        payload = load_yaml(self.target / "output" / "proposals" / proposal_id / "proposal.yaml")

        self.assertNotIn("tasks/templates/task-template.md", payload["changes"]["auto_apply"])
        self.assertIn("tasks/templates/task-template.md", payload["changes"]["proposal_required"])

    def test_normalize_proposal_skips_ai_exec_pack_assets(self) -> None:
        (self.target / "memory" / "project").mkdir(parents=True, exist_ok=True)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "README.md").write_text("# Legacy Repo\n\nlegacy app\n", encoding="utf8")

        subprocess.run(
            ["python3", str(ROOT / "scripts" / "init_project_compounding.py"), "attach", "--target", str(self.target)],
            check=True,
            capture_output=True,
            text=True,
        )

        proposal_id = create_proposal(self.target)
        payload = load_yaml(self.target / "output" / "proposals" / proposal_id / "proposal.yaml")
        all_paths = []
        for category in ("auto_apply", "proposal_required", "suggest_only", "blocked"):
            all_paths.extend(payload["changes"][category])

        self.assertNotIn("scripts/coord/preflight.ts", all_paths)

    def test_proposal_auto_applies_missing_operating_blueprint(self) -> None:
        (self.target / "memory" / "project").mkdir(parents=True, exist_ok=True)
        (self.target / "memory" / "project" / "roadmap.md").write_text("# 路线图\n", encoding="utf8")
        (self.target / "memory" / "project" / "current-state.md").write_text("# 当前状态\n", encoding="utf8")
        (self.target / "memory" / "project" / "tech-debt.md").write_text("# 技术债\n", encoding="utf8")
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "README.md").write_text("# Legacy Repo\n\nlegacy app\n", encoding="utf8")

        subprocess.run(
            ["python3", str(ROOT / "scripts" / "init_project_compounding.py"), "attach", "--target", str(self.target)],
            check=True,
            capture_output=True,
            text=True,
        )
        self.init_git_repo()
        subprocess.run(["git", "add", "."], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "commit", "-m", "baseline"], cwd=self.target, check=True, capture_output=True, text=True)

        proposal_id = create_proposal(self.target)
        payload = load_yaml(self.target / "output" / "proposals" / proposal_id / "proposal.yaml")
        self.assertIn("memory/project/operating-blueprint.md", payload["changes"]["auto_apply"])

        result = apply_proposal(self.target, proposal_id)
        self.assertEqual(result["status"], "applied")
        self.assertTrue((self.target / "memory" / "project" / "operating-blueprint.md").exists())

    def test_proposal_respects_explicit_local_override_for_managed_docs(self) -> None:
        (self.target / "memory" / "project").mkdir(parents=True, exist_ok=True)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "README.md").write_text("# Legacy Repo\n\nlegacy app\n", encoding="utf8")
        (self.target / "AGENTS.md").write_text("# local agents\n", encoding="utf8")

        subprocess.run(
            ["python3", str(ROOT / "scripts" / "init_project_compounding.py"), "attach", "--target", str(self.target)],
            check=True,
            capture_output=True,
            text=True,
        )
        brief_path = self.target / "bootstrap" / "project_brief.yaml"
        brief = load_yaml(brief_path)
        brief["local_overrides"]["owned_paths"].append("AGENTS.md")
        from scripts.compounding_bootstrap.yaml_io import save_yaml

        save_yaml(brief_path, brief)

        proposal_id = create_proposal(self.target)
        payload = load_yaml(self.target / "output" / "proposals" / proposal_id / "proposal.yaml")

        self.assertNotIn("AGENTS.md", payload["changes"]["proposal_required"])
        self.assertIn("AGENTS.md", payload["changes"]["suggest_only"])
        self.assertFalse(any(item["path"] == "AGENTS.md" for item in payload["conflicts"]))

    def test_apply_proposal_rejects_when_no_auto_apply_exists(self) -> None:
        bootstrap(self.brief_path, self.target)
        self.init_git_repo()
        subprocess.run(["git", "add", "."], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "commit", "-m", "baseline"], cwd=self.target, check=True, capture_output=True, text=True)

        proposal_id = create_proposal(self.target)

        with self.assertRaisesRegex(ValueError, "no auto_apply"):
            apply_proposal(self.target, proposal_id)

    def test_pre_mutation_check_outputs_json(self) -> None:
        bootstrap(self.brief_path, self.target)
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

    def test_release_lib_materializes_and_prunes_prod_runtime_copy(self) -> None:
        script = """
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "compounding-runtime-"));
process.env.AI_OS_RELEASE_ROOT = runtimeRoot;
const { materializeProdRuntime, pruneInactiveProdRuntimeCopies, ensureLayout } = require("./scripts/release/lib.ts");
const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "compounding-source-"));
const releasePath = path.join(sourceRoot, "sample-release");
fs.mkdirSync(path.join(releasePath, "apps", "studio", ".next"), { recursive: true });
fs.mkdirSync(path.join(releasePath, ".git"), { recursive: true });
fs.writeFileSync(path.join(releasePath, "apps", "studio", ".next", "BUILD_ID"), "sample-build\\n");
fs.writeFileSync(path.join(releasePath, ".git", "HEAD"), "ref: refs/heads/main\\n");
fs.writeFileSync(path.join(releasePath, "package.json"), JSON.stringify({ name: "sample-release", private: true }));
const runtimePath = materializeProdRuntime(releasePath, "20260324150000-sample-prod");
fs.mkdirSync(path.join(ensureLayout().prodLiveDir, "old-prod"), { recursive: true });
pruneInactiveProdRuntimeCopies("20260324150000-sample-prod");
console.log(JSON.stringify({
  runtimePath,
  hasBuildId: fs.existsSync(path.join(runtimePath, "apps", "studio", ".next", "BUILD_ID")),
  copiedGitDir: fs.existsSync(path.join(runtimePath, ".git")),
  oldStillExists: fs.existsSync(path.join(ensureLayout().prodLiveDir, "old-prod")),
}));
"""
        completed = subprocess.run(
            ["node", "--experimental-strip-types", "-e", script],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        payload = json.loads(completed.stdout)
        self.assertTrue(payload["runtimePath"].endswith("/live/prod/20260324150000-sample-prod"))
        self.assertTrue(payload["hasBuildId"])
        self.assertFalse(payload["copiedGitDir"])
        self.assertFalse(payload["oldStillExists"])

    def test_release_lib_materializes_plain_release_dirs_and_detaches_legacy_worktrees(self) -> None:
        script = """
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const runtimeRoot = fs.mkdtempSync(path.join(os.tmpdir(), "compounding-release-root-"));
process.env.AI_OS_RELEASE_ROOT = runtimeRoot;
const { ensureLayout, git, materializeReleaseWorkspace, detachReleaseWorktree } = require("./scripts/release/lib.ts");
const layout = ensureLayout();
const commitSha = git(["rev-parse", "HEAD"]);
const plainReleasePath = path.join(layout.releasesDir, "plain-release");
materializeReleaseWorkspace(plainReleasePath, "plain-release", commitSha);
const legacyReleasePath = path.join(layout.releasesDir, "legacy-release");
git(["worktree", "add", "--detach", legacyReleasePath, commitSha]);
const before = git(["worktree", "list"]);
const detached = detachReleaseWorktree(legacyReleasePath);
const after = git(["worktree", "list"]);
console.log(JSON.stringify({
  plainHasGit: fs.existsSync(path.join(plainReleasePath, ".git")),
  plainHasPackageJson: fs.existsSync(path.join(plainReleasePath, "package.json")),
  legacyDetached: detached.detached,
  legacyHasGit: fs.existsSync(path.join(legacyReleasePath, ".git")),
  beforeHasLegacy: before.includes(legacyReleasePath),
  afterHasLegacy: after.includes(legacyReleasePath),
}));
"""
        completed = subprocess.run(
            ["node", "--experimental-strip-types", "-e", script],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        payload = json.loads(completed.stdout)
        self.assertFalse(payload["plainHasGit"])
        self.assertTrue(payload["plainHasPackageJson"])
        self.assertTrue(payload["legacyDetached"])
        self.assertFalse(payload["legacyHasGit"])
        self.assertTrue(payload["beforeHasLegacy"])
        self.assertFalse(payload["afterHasLegacy"])


if __name__ == "__main__":
    unittest.main()
