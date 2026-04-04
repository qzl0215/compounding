import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def governance_matrix(rows: list[tuple[str, str, str, str, str, str]]) -> str:
    lines = [
        "## 治理守护矩阵 v1",
        "",
        "| assertion_id | assertion | primary_guard | probe_rule | failure_signal | coverage_status |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


class AiGovernanceGuardsCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.target = Path(self.temp_dir.name)
        shutil.copy(ROOT / "AGENTS.md", self.target / "AGENTS.md")
        shutil.copytree(ROOT / "memory", self.target / "memory")
        shutil.copytree(ROOT / "bootstrap", self.target / "bootstrap")
        shutil.copytree(ROOT / "shared", self.target / "shared")
        shutil.copytree(ROOT / "scripts" / "ai", self.target / "scripts" / "ai")
        shutil.copy(ROOT / "package.json", self.target / "package.json")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def run_script(self, relative_script: str, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["node", "--experimental-strip-types", str(self.target / relative_script), *args],
            cwd=self.target,
            capture_output=True,
            text=True,
        )

    def write_governance_matrix(self, rows: list[tuple[str, str, str, str, str, str]]) -> None:
        blueprint = self.target / "memory" / "project" / "operating-blueprint.md"
        content = blueprint.read_text(encoding="utf8")
        matrix = governance_matrix(rows)
        if "## 治理守护矩阵 v1" in content:
            before, _, _ = content.partition("## 治理守护矩阵 v1")
            blueprint.write_text(before.rstrip() + "\n\n" + matrix + "\n", encoding="utf8")
            return
        blueprint.write_text(content.rstrip() + "\n\n" + matrix + "\n", encoding="utf8")

    def update_package_scripts(self, mutator) -> None:
        package_path = self.target / "package.json"
        payload = json.loads(package_path.read_text(encoding="utf8"))
        mutator(payload["scripts"])
        package_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf8")

    def valid_rows(self) -> list[tuple[str, str, str, str, str, str]]:
        return [
            ("A4", "Task 只能承接已收口范围", "pnpm ai:validate-task-git", "script exists + validate:static includes it", "task 未合法绑定 gap / from_assertion / writeback_targets", "active"),
            ("A6", "Gap 必须来自断言比较", "pnpm ai:validate-task-git", "script exists + validate:static includes it", "gap 来源不合法、gap 主源不一致、从 task 或 patch 倒推", "active"),
            ("A7", "行为变化后必须回写真相", "pnpm ai:validate-task-git", "script exists + validate:static includes it", "声明的 truth sink 未兑现", "active"),
            ("A9", "治理规则必须有 guard", "pnpm ai:validate-governance-guards", "script exists + validate:static includes it", "守护矩阵缺项、guard 入口漂移、static gate 未接入", "active"),
        ]

    def test_validate_governance_guards_fails_when_a7_missing(self) -> None:
        rows = [row for row in self.valid_rows() if row[0] != "A7"]
        self.write_governance_matrix(rows)

        completed = self.run_script("scripts/ai/validate-governance-guards.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("A7", payload["details"]["missing_assertions"])

    def test_validate_governance_guards_fails_when_a4_duplicated(self) -> None:
        rows = self.valid_rows()
        rows.append(rows[0])
        self.write_governance_matrix(rows)

        completed = self.run_script("scripts/ai/validate-governance-guards.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("A4", payload["details"]["duplicate_assertions"])

    def test_validate_governance_guards_fails_when_primary_guard_script_missing(self) -> None:
        rows = self.valid_rows()
        rows[3] = ("A9", rows[3][1], "pnpm ai:missing-guard", rows[3][3], rows[3][4], rows[3][5])
        self.write_governance_matrix(rows)

        completed = self.run_script("scripts/ai/validate-governance-guards.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertTrue(any(item["assertion_id"] == "A9" for item in payload["details"]["unresolved_guards"]))

    def test_validate_governance_guards_fails_when_static_gate_missing(self) -> None:
        self.write_governance_matrix(self.valid_rows())
        self.update_package_scripts(lambda scripts: scripts.__setitem__("validate:static", "pnpm ai:validate-task-git && pnpm ai:validate-assets"))

        completed = self.run_script("scripts/ai/validate-governance-guards.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertIn("ai:validate-governance-guards", " ".join(payload["details"]["static_gate_drift"]))

    def test_validate_governance_guards_accepts_complete_matrix_without_a5(self) -> None:
        self.write_governance_matrix(self.valid_rows())
        self.update_package_scripts(
            lambda scripts: (
                scripts.__setitem__("ai:validate-governance-guards", "node --experimental-strip-types scripts/ai/validate-governance-guards.ts"),
                scripts.__setitem__(
                    "validate:static",
                    "pnpm lint && pnpm ai:scan-health && pnpm ai:validate-trace && pnpm ai:validate-task-git && pnpm ai:validate-governance-guards && pnpm ai:validate-assets",
                ),
            )
        )

        completed = self.run_script("scripts/ai/validate-governance-guards.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertEqual(payload["details"]["missing_assertions"], [])
        self.assertNotIn("A5", payload["details"]["checked_assertions"])

    def test_validate_governance_guards_requires_a9_to_self_guard(self) -> None:
        rows = self.valid_rows()
        rows[3] = ("A9", rows[3][1], "pnpm ai:validate-task-git", rows[3][3], rows[3][4], rows[3][5])
        self.write_governance_matrix(rows)

        completed = self.run_script("scripts/ai/validate-governance-guards.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertTrue(any(item["assertion_id"] == "A9" for item in payload["details"]["unresolved_guards"]))
