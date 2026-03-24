import unittest

from scripts.compounding_bootstrap.engine import attach, audit, bootstrap, load_yaml, migrate_legacy_config, scaffold, validate_config_file
from tests.bootstrap_support import BootstrapWorkspaceTestCase


class BootstrapKernelShellTests(BootstrapWorkspaceTestCase):
    def test_bootstrap_creates_minimal_shell_and_audit_passes(self) -> None:
        bootstrap(self.brief_path, self.target)
        result = audit(self.brief_path, self.target)

        self.assertTrue(result.passed, msg=result.errors)
        self.assertTrue((self.target / "AGENTS.md").exists())
        self.assertTrue((self.target / "docs" / "WORK_MODES.md").exists())
        self.assertTrue((self.target / "docs" / "DEV_WORKFLOW.md").exists())
        self.assertTrue((self.target / "docs" / "ARCHITECTURE.md").exists())
        self.assertTrue((self.target / "schemas" / "project_brief.schema.yaml").exists())
        self.assertTrue((self.target / "templates" / "proposal.template.yaml").exists())
        self.assertTrue((self.target / "kernel" / "kernel_manifest.yaml").exists())
        self.assertTrue((self.target / "tasks" / "templates" / "task-template.md").exists())
        self.assertTrue((self.target / "scripts" / "init_project_compounding.py").exists())
        self.assertTrue((self.target / "output" / "bootstrap" / "bootstrap_report.yaml").exists())

    def test_attach_generates_report_and_detects_local_overrides(self) -> None:
        (self.target / "memory" / "project").mkdir(parents=True, exist_ok=True)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "apps" / "api").mkdir(parents=True, exist_ok=True)
        (self.target / "README.md").write_text("# Legacy Repo\n\nlegacy app\n", encoding="utf8")

        report = attach(self.brief_path, self.target)

        self.assertEqual(report["kernel"]["adoption_mode"], "attach")
        self.assertIn("memory/project/**", report["detected"]["local_overrides"])
        self.assertIn("tasks/queue/**", report["detected"]["local_overrides"])
        self.assertIn("apps/**", report["detected"]["local_overrides"])
        self.assertTrue((self.target / "output" / "bootstrap" / "bootstrap_report.yaml").exists())

    def test_validate_config_file_fails_for_invalid_adoption_mode(self) -> None:
        self.brief_path.write_text(
            """
project_identity:
  name: Invalid Example
  one_liner: invalid
  success_criteria:
    - invalid
kernel:
  version: 0.1.0
  adoption_mode: invalid
runtime_boundary:
  app_type: app
  deploy_target: local
  critical_paths:
    - AGENTS.md
local_overrides:
  owned_paths:
    - apps/**
  protected_rules:
    - 禁止自动修改核心业务代码
upgrade_policy:
  auto_apply_paths: []
  proposal_required_paths: []
  blocked_paths:
    - apps/**
""".strip()
            + "\n",
            encoding="utf8",
        )

        result = validate_config_file(self.brief_path, self.target)

        self.assertFalse(result["ok"])
        self.assertTrue(any("adoption_mode" in key for key in result["field_errors"]))

    def test_migrate_legacy_config_writes_new_brief_shape(self) -> None:
        self.brief_path.unlink()
        migrated = migrate_legacy_config(self.target)
        payload = load_yaml(migrated)

        self.assertEqual(migrated, self.brief_path)
        self.assertIn("project_identity", payload)
        self.assertIn("kernel", payload)
        self.assertIn("runtime_boundary", payload)
        self.assertIn("upgrade_policy", payload)

    def test_scaffold_alias_routes_to_bootstrap(self) -> None:
        report = scaffold(self.brief_path, self.target)

        self.assertEqual(report["kernel"]["adoption_mode"], "new")
        self.assertTrue((self.target / "kernel" / "kernel_manifest.yaml").exists())


if __name__ == "__main__":
    unittest.main()
