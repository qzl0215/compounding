import unittest

from scripts.compounding_bootstrap.engine import (
    AGENTS_PATH,
    audit,
    load_yaml,
    migrate_legacy_config,
    scaffold,
    validate_config_file,
)
from tests.bootstrap_support import BootstrapWorkspaceTestCase


class BootstrapScaffoldCliTests(BootstrapWorkspaceTestCase):
    def test_scaffold_and_audit_pass(self) -> None:
        scaffold(self.brief_path, self.target)
        result = audit(self.brief_path, self.target)

        self.assertTrue(result.passed, msg=result.errors)
        self.assertTrue((self.target / AGENTS_PATH).exists())
        self.assertTrue((self.target / "docs" / "PROJECT_RULES.md").exists())
        self.assertFalse((self.target / "docs" / "ORG_MODEL.md").exists())
        self.assertTrue((self.target / "docs" / "ASSET_MAINTENANCE.md").exists())
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
        doc_path.write_text(original + "\n人工追加笔记：不要覆盖我。\n", encoding="utf8")

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

    def test_audit_rejects_missing_agents_plan_pointer(self) -> None:
        scaffold(self.brief_path, self.target)
        agents_path = self.target / AGENTS_PATH
        agents_text = agents_path.read_text(encoding="utf8")
        agents_path.write_text(
            agents_text.replace(
                "- 计划主源：`memory/project/operating-blueprint.md`",
                "- 计划主源：`memory/project/missing-blueprint.md`",
                1,
            ),
            encoding="utf8",
        )

        result = audit(self.brief_path, self.target)

        self.assertFalse(result.passed)
        self.assertTrue(
            any("AGENTS truth map must declare memory/project/operating-blueprint.md as the single plan source." in item for item in result.errors)
        )

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

    def test_audit_rejects_bundled_source_of_truth(self) -> None:
        scaffold(self.brief_path, self.target)
        agents_path = self.target / AGENTS_PATH
        agents_text = agents_path.read_text(encoding="utf8")
        agents_path.write_text(
            agents_text.replace("source_of_truth: AGENTS.md", "source_of_truth: AGENTS.md + docs/PROJECT_RULES.md", 1),
            encoding="utf8",
        )

        result = audit(self.brief_path, self.target)

        self.assertFalse(result.passed)
        self.assertTrue(any("AGENTS.md must use a single source_of_truth owner." in item for item in result.errors))

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


if __name__ == "__main__":
    unittest.main()
