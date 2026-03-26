import json
import re
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class AiAssetsCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.target = Path(self.temp_dir.name)
        shutil.copy(ROOT / "AGENTS.md", self.target / "AGENTS.md")
        shutil.copytree(ROOT / "docs", self.target / "docs")
        shutil.copytree(ROOT / "memory", self.target / "memory")
        shutil.copytree(ROOT / "code_index", self.target / "code_index")
        shutil.copytree(ROOT / "scripts" / "ai", self.target / "scripts" / "ai")
        shutil.copytree(ROOT / "tasks" / "templates", self.target / "tasks" / "templates")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def run_script(self, relative_script: str, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["node", "--experimental-strip-types", str(self.target / relative_script), *args],
            cwd=self.target,
            capture_output=True,
            text=True,
        )

    def replace_review_date(self, relative_path: str, date_value: str) -> None:
        target = self.target / relative_path
        content = target.read_text(encoding="utf8")
        updated = re.sub(r"last_reviewed_at: \d{4}-\d{2}-\d{2}", f"last_reviewed_at: {date_value}", content, count=1)
        target.write_text(updated, encoding="utf8")

    def init_git_repo(self) -> None:
        subprocess.run(["git", "init"], cwd=self.target, check=True)
        subprocess.run(["git", "config", "user.name", "Test User"], cwd=self.target, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=self.target, check=True)
        subprocess.run(["git", "add", "."], cwd=self.target, check=True)
        subprocess.run(["git", "commit", "-m", "baseline"], cwd=self.target, check=True)

    def test_validate_knowledge_assets_warns_for_stale_governance_doc_and_fails_in_strict(self) -> None:
        self.replace_review_date("docs/WORK_MODES.md", "2026-02-01")

        completed = self.run_script("scripts/ai/validate-knowledge-assets.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertEqual(payload["quality_grade"], "B")
        self.assertTrue(any("docs/WORK_MODES.md" in warning for warning in payload["warnings"]))

        strict = self.run_script("scripts/ai/validate-knowledge-assets.ts", "--strict")
        strict_payload = json.loads(strict.stdout)

        self.assertNotEqual(strict.returncode, 0)
        self.assertTrue(any("docs/WORK_MODES.md" in error for error in strict_payload["errors"]))

    def test_validate_knowledge_assets_requires_review_bump_when_manual_doc_changes(self) -> None:
        self.init_git_repo()
        target = self.target / "docs" / "AI_OPERATING_MODEL.md"
        content = target.read_text(encoding="utf8")
        target.write_text(
            content.replace(
                "- AI 默认先做三步：扩选项 → 收决策 → 产出 task。",
                "- AI 默认先做三步：扩选项 → 收决策 → 产出 task。\n- 这是一条测试修改，用来验证 review bump 规则。",
            ),
            encoding="utf8",
        )

        completed = self.run_script("scripts/ai/validate-knowledge-assets.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertTrue(any("changed manual doc must update last_reviewed_at" in error for error in payload["errors"]))

    def test_validate_knowledge_assets_rejects_broken_related_docs(self) -> None:
        target = self.target / "memory" / "project" / "roadmap.md"
        content = target.read_text(encoding="utf8")
        target.write_text(
            content.replace("  - docs/WORK_MODES.md", "  - docs/WORK_MODES.md\n  - docs/MISSING_REFERENCE.md"),
            encoding="utf8",
        )

        completed = self.run_script("scripts/ai/validate-knowledge-assets.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertTrue(any("docs/MISSING_REFERENCE.md" in error for error in payload["errors"]))

    def test_cleanup_candidates_generates_report_with_stale_doc_candidate(self) -> None:
        self.replace_review_date("docs/WORK_MODES.md", "2026-02-01")
        helpers_file = self.target / "scripts" / "ai" / "helpers.ts"
        helpers_file.write_text("// cleanup marker\nexport const sample = 1;\n", encoding="utf8")

        completed = self.run_script("scripts/ai/cleanup-candidates.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(Path(payload["json_path"]).exists())
        self.assertTrue(Path(payload["md_path"]).exists())

        report = json.loads(Path(payload["json_path"]).read_text(encoding="utf8"))
        self.assertGreater(report["candidate_count"], 0)
        self.assertTrue(
            any(candidate["category"] == "stale-doc" and "docs/WORK_MODES.md" in candidate["paths"] for candidate in report["candidates"])
        )

    def test_retro_candidates_only_emit_repeated_blockers(self) -> None:
        companion_dir = self.target / "agent-coordination" / "tasks"
        companion_dir.mkdir(parents=True, exist_ok=True)
        companion_dir.joinpath("task-111-a.json").write_text(
            json.dumps(
                {
                    "task_id": "t-111",
                    "task_path": "tasks/queue/task-111-a.md",
                    "artifacts": {
                        "iteration_digest": {
                            "top_blockers": [
                                {
                                    "signature": "preflight:工作区未清理",
                                    "stage": "preflight",
                                    "reason": "工作区未清理",
                                    "repeat_count": 1,
                                    "lost_time_ms": 4000,
                                    "related_docs": ["AGENTS.md"],
                                }
                            ]
                        }
                    },
                },
                ensure_ascii=False,
            ),
            encoding="utf8",
        )
        companion_dir.joinpath("task-112-b.json").write_text(
            json.dumps(
                {
                    "task_id": "t-112",
                    "task_path": "tasks/queue/task-112-b.md",
                    "artifacts": {
                        "iteration_digest": {
                            "top_blockers": [
                                {
                                    "signature": "preflight:工作区未清理",
                                    "stage": "preflight",
                                    "reason": "工作区未清理",
                                    "repeat_count": 1,
                                    "lost_time_ms": 3000,
                                    "related_docs": ["docs/DEV_WORKFLOW.md"],
                                },
                                {
                                    "signature": "scope:范围越界",
                                    "stage": "review",
                                    "reason": "范围越界",
                                    "repeat_count": 1,
                                    "lost_time_ms": 2000,
                                    "related_docs": ["AGENTS.md"],
                                },
                            ]
                        }
                    },
                },
                ensure_ascii=False,
            ),
            encoding="utf8",
        )

        completed = self.run_script("scripts/ai/retro-candidates.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        report = json.loads(Path(payload["json_path"]).read_text(encoding="utf8"))
        self.assertEqual(report["candidate_count"], 1)
        self.assertEqual(report["candidates"][0]["signature"], "preflight:工作区未清理")
        self.assertEqual(report["candidates"][0]["repeat_count"], 2)
        self.assertEqual(sorted(report["candidates"][0]["affected_tasks"]), ["t-111", "t-112"])
        self.assertEqual(report["candidates"][0]["lost_time_ms"], 7000)


if __name__ == "__main__":
    unittest.main()
