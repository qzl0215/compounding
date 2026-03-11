import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.compounding_bootstrap.engine import (
    apply_proposal,
    audit,
    baseline_commit_suggestion,
    create_proposal,
    load_yaml,
    migrate_legacy_config,
    scaffold,
    validate_config_file,
)


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
        self.assertTrue((self.target / "docs/PROJECT_CARD.md").exists())
        self.assertTrue((self.target / "output/bootstrap/project_bootstrap.resolved.yaml").exists())

    def test_scaffold_preserves_manual_notes(self) -> None:
        scaffold(self.brief_path, self.target)
        doc_path = self.target / "docs/PROJECT_CARD.md"
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
        prompt_file.write_text("把项目作战卡里的成功定义写得更清楚，并强化 review 规则。", encoding="utf8")

        proposal_id = create_proposal(self.brief_path, self.target, prompt_file)
        proposal_root = self.target / "output" / "proposals" / proposal_id
        metadata_path = proposal_root / "metadata.json"
        metadata = json.loads(metadata_path.read_text(encoding="utf8"))

        self.assertEqual(metadata["status"], "pending")
        self.assertEqual(metadata["action_type"], "canonical_update")
        self.assertGreater(len(metadata["target_blocks"]), 0)
        self.assertTrue((proposal_root / "diff.patch").exists())

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

        doc_path = self.target / "docs/PROJECT_CARD.md"
        doc_path.write_text(doc_path.read_text(encoding="utf8") + "\nmanual dirty change\n", encoding="utf8")

        with self.assertRaisesRegex(ValueError, "worktree is dirty"):
            apply_proposal(self.target, proposal_id)


if __name__ == "__main__":
    unittest.main()
