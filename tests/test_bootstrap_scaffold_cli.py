import json
import unittest

from scripts.compounding_bootstrap.packs import export_packs
from scripts.compounding_bootstrap.doctor import doctor
from scripts.compounding_bootstrap.engine import attach, audit, bootstrap, load_yaml, migrate_legacy_config, scaffold, validate_config_file
from tests.bootstrap_support import ROOT, BootstrapWorkspaceTestCase


class BootstrapKernelShellTests(BootstrapWorkspaceTestCase):
    def test_bootstrap_creates_minimal_shell_and_audit_passes(self) -> None:
        bootstrap(self.brief_path, self.target)
        result = audit(self.brief_path, self.target)
        brief = load_yaml(self.brief_path)
        operator = load_yaml(self.target / "bootstrap" / "project_operator.yaml")

        self.assertTrue(result.passed, msg=result.errors)
        self.assertEqual(brief["bootstrap_mode"], "cold_start")
        self.assertEqual(brief["kernel"]["profile"], "governance")
        self.assertEqual(operator["project"]["bootstrap_mode"], "cold_start")
        self.assertTrue((self.target / "AGENTS.md").exists())
        self.assertTrue((self.target / "docs" / "WORK_MODES.md").exists())
        self.assertTrue((self.target / "docs" / "DEV_WORKFLOW.md").exists())
        self.assertTrue((self.target / "docs" / "ARCHITECTURE.md").exists())
        self.assertTrue((self.target / "docs" / "OPERATOR_RUNBOOK.md").exists())
        self.assertTrue((self.target / "CLAUDE.md").exists())
        self.assertTrue((self.target / "OPENCODE.md").exists())
        self.assertTrue((self.target / ".cursor" / "rules" / "00-project-entry.mdc").exists())
        self.assertTrue((self.target / "schemas" / "project_brief.schema.yaml").exists())
        self.assertTrue((self.target / "schemas" / "project_operator.schema.yaml").exists())
        self.assertTrue((self.target / "templates" / "proposal.template.yaml").exists())
        self.assertTrue((self.target / "templates" / "project_operator.template.yaml").exists())
        self.assertTrue((self.target / "kernel" / "kernel_manifest.yaml").exists())
        self.assertTrue((self.target / "tasks" / "templates" / "task-template.md").exists())
        self.assertTrue((self.target / "scripts" / "init_project_compounding.py").exists())
        self.assertTrue((self.target / "scripts" / "ai" / "generate-operator-assets.ts").exists())
        self.assertTrue((self.target / "scripts" / "ai" / "validate-operator-contract.ts").exists())
        self.assertTrue((self.target / "bootstrap" / "project_operator.yaml").exists())
        self.assertTrue((self.target / "output" / "bootstrap" / "bootstrap_report.yaml").exists())
        architecture = (self.target / "docs" / "ARCHITECTURE.md").read_text(encoding="utf8")
        self.assertIn("core：`apps/studio/src/app/*`", architecture)
        self.assertIn("bootstrap：`scripts/compounding_bootstrap/*`", architecture)
        self.assertIn("config：`package.json`", architecture)
        self.assertIn("derived / runtime：`output/*`", architecture)

    def test_document_manifest_exposes_layered_classification(self) -> None:
        payload = json.loads((ROOT / "bootstrap" / "templates" / "document_manifest.json").read_text(encoding="utf8"))

        self.assertIn("core_docs", payload)
        self.assertIn("appendix_docs", payload)
        self.assertIn("layers", payload)
        self.assertIn("core", payload["layers"])
        self.assertIn("bootstrap", payload["layers"])
        self.assertIn("config", payload["layers"])
        self.assertIn("governance", payload["layers"])
        self.assertIn("derived", payload["layers"])

    def test_attach_generates_report_and_detects_local_overrides(self) -> None:
        (self.target / "memory" / "project").mkdir(parents=True, exist_ok=True)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "apps" / "api").mkdir(parents=True, exist_ok=True)
        (self.target / "README.md").write_text("# Legacy Repo\n\nlegacy app\n", encoding="utf8")

        report = attach(self.brief_path, self.target)

        self.assertEqual(report["kernel"]["adoption_mode"], "attach")
        self.assertIn("memory/**", report["detected"]["local_overrides"])
        self.assertIn("tasks/queue/**", report["detected"]["local_overrides"])
        self.assertIn("apps/**", report["detected"]["local_overrides"])
        self.assertTrue((self.target / "output" / "bootstrap" / "bootstrap_report.yaml").exists())
        self.assertTrue((self.target / "bootstrap" / "project_operator.yaml").exists())

    def test_attach_infers_next_static_site_runtime_and_owned_paths(self) -> None:
        (self.target / "memory" / "project").mkdir(parents=True, exist_ok=True)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "src" / "app").mkdir(parents=True, exist_ok=True)
        (self.target / "src" / "modules").mkdir(parents=True, exist_ok=True)
        (self.target / "deploy").mkdir(parents=True, exist_ok=True)
        (self.target / "README.md").write_text(
            "# qianfamily\n\n`qianfamily.online` 当前是静态中文宗亲门户站。\n",
            encoding="utf8",
        )
        (self.target / "next.config.ts").write_text('export default { output: "export" };\n', encoding="utf8")
        (self.target / "package.json").write_text(
            '{"dependencies":{"next":"15.0.0","react":"19.0.0","react-dom":"19.0.0"}}\n',
            encoding="utf8",
        )

        attach(self.brief_path, self.target)
        brief = load_yaml(self.brief_path)

        self.assertEqual(brief["project_identity"]["one_liner"], "`qianfamily.online` 当前是静态中文宗亲门户站。")
        self.assertEqual(brief["kernel"]["profile"], "governance")
        self.assertEqual(brief["runtime_boundary"]["app_type"], "nextjs-static-site")
        self.assertEqual(brief["runtime_boundary"]["deploy_target"], "nginx-static-export")
        self.assertIn("src/**", brief["local_overrides"]["owned_paths"])
        self.assertIn("src/**", brief["upgrade_policy"]["blocked_paths"])
        self.assertIn("src/app/**", brief["runtime_boundary"]["critical_paths"])

    def test_attach_infers_python_service_archetype(self) -> None:
        (self.target / "README.md").write_text("# Service\n\nPython worker\n", encoding="utf8")
        (self.target / "pyproject.toml").write_text("[project]\nname='worker'\nversion='0.1.0'\n", encoding="utf8")
        (self.target / "src" / "worker").mkdir(parents=True, exist_ok=True)
        (self.target / "Dockerfile").write_text("FROM python:3.12-slim\n", encoding="utf8")

        attach(self.brief_path, self.target)
        brief = load_yaml(self.brief_path)

        self.assertEqual(brief["kernel"]["profile"], "governance")
        self.assertEqual(brief["runtime_boundary"]["app_type"], "python-service")
        self.assertEqual(brief["runtime_boundary"]["deploy_target"], "container-service")

    def test_doctor_recommends_bootstrap_for_new_shell(self) -> None:
        self.brief_path.unlink()
        payload = doctor(self.brief_path, self.target)

        self.assertFalse(payload["kernel"]["brief_present"])
        self.assertEqual(payload["kernel"]["profile"], "governance")
        self.assertEqual(payload["recommended_mode"], "cold_start")
        self.assertEqual(payload["recommended_entry"], "bootstrap")
        self.assertEqual(payload["required_packs"], ["protocol_pack", "operator_pack", "tooling_pack"])
        self.assertEqual([item["mode_id"] for item in payload["mode_guides"]], ["cold_start", "normalize", "ai_upgrade"])
        self.assertEqual(payload["archetype"]["package_manager"], "unknown")
        self.assertFalse(payload["ready_for_ai_iteration"])
        self.assertTrue(any("bootstrap" in step for step in payload["next_steps"]))

    def test_doctor_reports_governance_profile_for_attached_repo(self) -> None:
        (self.target / "README.md").write_text("# Legacy Repo\n\nlegacy app\n", encoding="utf8")
        (self.target / "package.json").write_text('{"scripts":{"build":"echo build"}}\n', encoding="utf8")
        attach(self.brief_path, self.target)

        payload = doctor(self.brief_path, self.target)

        self.assertTrue(payload["kernel"]["brief_present"])
        self.assertEqual(payload["kernel"]["profile"], "governance")
        self.assertEqual(payload["recommended_entry"], "audit")
        self.assertTrue(any(item["mode_id"] == "ai_upgrade" and item["supported"] for item in payload["mode_guides"]))
        operator_layer = next(item for item in payload["capabilities"] if item["capability_id"] == "operator_layer")
        self.assertFalse(operator_layer["ok"])
        self.assertTrue(any("generate-operator-assets" in step for step in payload["next_steps"]))

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
        self.assertEqual(report["kernel"]["bootstrap_mode"], "cold_start")
        self.assertTrue((self.target / "kernel" / "kernel_manifest.yaml").exists())

    def test_audit_requires_project_operator_contract(self) -> None:
        bootstrap(self.brief_path, self.target)
        (self.target / "bootstrap" / "project_operator.yaml").unlink()

        result = audit(self.brief_path, self.target)

        self.assertFalse(result.passed)
        self.assertTrue(any("project_operator.yaml" in error for error in result.errors))

    def test_bootstrap_ai_upgrade_copies_execution_pack_for_supported_repo(self) -> None:
        (self.target / "package.json").write_text('{"scripts":{"build":"echo build","test":"echo test"}}\n', encoding="utf8")

        report = bootstrap(self.brief_path, self.target, bootstrap_mode="ai_upgrade")
        brief = load_yaml(self.brief_path)

        self.assertEqual(brief["bootstrap_mode"], "ai_upgrade")
        self.assertEqual(brief["kernel"]["profile"], "full_ai_dev")
        self.assertIn("ai_exec_pack", report["kernel"]["required_packs"])
        self.assertTrue(report["status"]["ready_for_ai_iteration"])
        self.assertTrue((self.target / "scripts" / "coord" / "preflight.ts").exists())
        self.assertTrue((self.target / "scripts" / "ai" / "preflight-summary.ts").exists())
        self.assertTrue((self.target / "scripts" / "ai" / "find-summary.ts").exists())
        self.assertTrue((self.target / "scripts" / "ai" / "read-summary.ts").exists())
        self.assertTrue((self.target / "scripts" / "ai" / "lib" / "retro-candidates.ts").exists())
        self.assertTrue((self.target / "scripts" / "pre_mutation_check.py").exists())

    def test_doctor_downgrades_unsupported_ai_upgrade_to_cold_start(self) -> None:
        self.brief_path.unlink()

        payload = doctor(self.brief_path, self.target, bootstrap_mode="ai_upgrade")

        self.assertEqual(payload["requested_mode"], "ai_upgrade")
        self.assertEqual(payload["recommended_mode"], "cold_start")
        self.assertEqual(payload["archetype"]["adapter_id"], "generic_repo")
        self.assertNotIn("ai_exec_pack", payload["required_packs"])

    def test_export_packs_writes_pack_and_mode_manifest(self) -> None:
        export_path = export_packs(self.target / "output" / "bootstrap" / "pack-exports.yaml")
        payload = load_yaml(export_path)

        self.assertTrue(export_path.exists())
        self.assertTrue(any(item["pack_id"] == "protocol_pack" and item["file_count"] > 0 for item in payload["packs"]))
        self.assertTrue(any(item["mode_id"] == "ai_upgrade" and "ai_exec_pack" in item["required_packs"] for item in payload["mode_packs"]))


if __name__ == "__main__":
    unittest.main()
