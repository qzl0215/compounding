import shutil
import tempfile
import unittest
from pathlib import Path

from scripts.compounding_bootstrap.doctor import doctor
from scripts.compounding_bootstrap.engine import attach, audit, bootstrap, load_yaml
from scripts.compounding_bootstrap.proposal import create_proposal
from tests.bootstrap_support import ROOT


class BootstrapGoldenMatrixTests(unittest.TestCase):
    def run_case(self, mode: str, entry: str, setup) -> tuple[dict, dict, dict, dict]:
        with tempfile.TemporaryDirectory() as temp_dir:
            target = Path(temp_dir)
            shutil.copytree(ROOT / "bootstrap", target / "bootstrap")
            brief_path = target / "bootstrap" / "project_brief.yaml"
            setup(target)

            before = doctor(brief_path, target, bootstrap_mode=mode)
            report = bootstrap(brief_path, target, bootstrap_mode=mode) if entry == "bootstrap" else attach(brief_path, target, bootstrap_mode=mode)
            audit_result = audit(brief_path, target)
            proposal_id = create_proposal(target)
            proposal = load_yaml(target / "output" / "proposals" / proposal_id / "proposal.yaml")
            after = doctor(brief_path, target, bootstrap_mode=mode)
            return before, report, audit_result, after | {"proposal": proposal}

    def test_golden_mode_matrix_smoke(self) -> None:
        cases = [
            {
                "name": "cold_start_generic",
                "mode": "cold_start",
                "entry": "bootstrap",
                "setup": lambda target: None,
                "adapter": "generic_repo",
                "expects_ai_exec": False,
            },
            {
                "name": "cold_start_web_app",
                "mode": "cold_start",
                "entry": "bootstrap",
                "setup": lambda target: (
                    (target / "package.json").write_text('{"dependencies":{"next":"15.0.0","react":"19.0.0","react-dom":"19.0.0"}}\n', encoding="utf8"),
                    (target / "next.config.ts").write_text("export default {};\n", encoding="utf8"),
                    (target / "src" / "app").mkdir(parents=True, exist_ok=True),
                ),
                "adapter": "web_app",
                "expects_ai_exec": False,
            },
            {
                "name": "normalize_node_service",
                "mode": "normalize",
                "entry": "attach",
                "setup": lambda target: (
                    (target / "README.md").write_text("# Service\n\nnode service\n", encoding="utf8"),
                    (target / "package.json").write_text('{"scripts":{"build":"echo build","test":"echo test","dev":"echo dev"}}\n', encoding="utf8"),
                    (target / "src" / "service").mkdir(parents=True, exist_ok=True),
                ),
                "adapter": "node_service",
                "expects_ai_exec": False,
            },
            {
                "name": "normalize_python_service",
                "mode": "normalize",
                "entry": "attach",
                "setup": lambda target: (
                    (target / "README.md").write_text("# Worker\n\npython service\n", encoding="utf8"),
                    (target / "pyproject.toml").write_text("[project]\nname='worker'\nversion='0.1.0'\n", encoding="utf8"),
                    (target / "src" / "worker").mkdir(parents=True, exist_ok=True),
                ),
                "adapter": "python_service",
                "expects_ai_exec": False,
            },
            {
                "name": "ai_upgrade_node_service",
                "mode": "ai_upgrade",
                "entry": "attach",
                "setup": lambda target: (
                    (target / "README.md").write_text("# Service\n\nnode service\n", encoding="utf8"),
                    (target / "package.json").write_text(
                        '{"scripts":{"build":"echo build","test":"echo test","dev":"echo dev","preview:start":"echo preview","preview:stop":"echo preview","preview:status":"echo preview","preview:check":"echo preview","prod:start":"echo prod","prod:stop":"echo prod","prod:status":"echo prod","prod:check":"echo prod"}}\n',
                        encoding="utf8",
                    ),
                    (target / "src" / "service").mkdir(parents=True, exist_ok=True),
                ),
                "adapter": "node_service",
                "expects_ai_exec": True,
            },
            {
                "name": "ai_upgrade_web_app",
                "mode": "ai_upgrade",
                "entry": "attach",
                "setup": lambda target: (
                    (target / "README.md").write_text("# Web\n\nnext app\n", encoding="utf8"),
                    (target / "package.json").write_text(
                        '{"scripts":{"build":"echo build","test":"echo test","dev":"echo dev","preview:start":"echo preview","preview:stop":"echo preview","preview:status":"echo preview","preview:check":"echo preview","prod:start":"echo prod","prod:stop":"echo prod","prod:status":"echo prod","prod:check":"echo prod"},"dependencies":{"next":"15.0.0","react":"19.0.0","react-dom":"19.0.0"}}\n',
                        encoding="utf8",
                    ),
                    (target / "next.config.ts").write_text("export default {};\n", encoding="utf8"),
                    (target / "src" / "app").mkdir(parents=True, exist_ok=True),
                ),
                "adapter": "web_app",
                "expects_ai_exec": True,
            },
        ]

        for case in cases:
            with self.subTest(case=case["name"]):
                before, report, audit_result, after = self.run_case(case["mode"], case["entry"], case["setup"])
                proposal = after["proposal"]

                self.assertEqual(before["requested_mode"], case["mode"])
                self.assertEqual(after["recommended_mode"], case["mode"])
                self.assertEqual(after["archetype"]["adapter_id"], case["adapter"])
                self.assertEqual(proposal["bootstrap_mode"], case["mode"])
                self.assertEqual(after["required_packs"], proposal["required_packs"])
                self.assertEqual(report["kernel"]["bootstrap_mode"], case["mode"])
                self.assertEqual(after["mode_guides"][0]["mode_id"], "cold_start")
                if case["entry"] == "bootstrap":
                    self.assertTrue(audit_result.passed, msg=audit_result.errors)
                    self.assertTrue(after["ready_for_ai_iteration"])
                else:
                    self.assertFalse(audit_result.passed)
                    self.assertTrue(any("Missing kernel-managed assets" in error for error in audit_result.errors))
                if case["expects_ai_exec"]:
                    self.assertIn("ai_exec_pack", after["required_packs"])
                else:
                    self.assertNotIn("ai_exec_pack", after["required_packs"])


if __name__ == "__main__":
    unittest.main()
