import json
import os
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
        shutil.copy(ROOT / ".gitignore", self.target / ".gitignore")
        shutil.copytree(ROOT / "docs", self.target / "docs")
        shutil.copytree(ROOT / "memory", self.target / "memory")
        shutil.copytree(ROOT / "code_index", self.target / "code_index")
        shutil.copytree(ROOT / "bootstrap", self.target / "bootstrap")
        shutil.copytree(ROOT / "kernel", self.target / "kernel")
        shutil.copytree(ROOT / "schemas", self.target / "schemas")
        shutil.copytree(ROOT / "shared", self.target / "shared")
        (self.target / "apps" / "studio" / "src" / "modules" / "releases").mkdir(parents=True, exist_ok=True)
        shutil.copy(
            ROOT / "apps" / "studio" / "src" / "modules" / "releases" / "validation.ts",
            self.target / "apps" / "studio" / "src" / "modules" / "releases" / "validation.ts",
        )
        shutil.copytree(ROOT / "scripts" / "ai", self.target / "scripts" / "ai")
        shutil.copytree(ROOT / "scripts" / "coord", self.target / "scripts" / "coord")
        shutil.copytree(ROOT / "scripts" / "release", self.target / "scripts" / "release")
        shutil.copytree(ROOT / "tasks" / "templates", self.target / "tasks" / "templates")
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
        target = self.target / "memory" / "project" / "goals.md"
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

    def test_generate_operator_assets_writes_runbook_and_tool_entries(self) -> None:
        completed = self.run_script("scripts/ai/generate-operator-assets.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertIn("docs/OPERATOR_RUNBOOK.md", payload["generated_paths"])
        self.assertTrue((self.target / "docs" / "OPERATOR_RUNBOOK.md").exists())
        self.assertTrue((self.target / "CLAUDE.md").exists())
        self.assertTrue((self.target / "OPENCODE.md").exists())
        self.assertTrue((self.target / ".cursor" / "rules" / "00-project-entry.mdc").exists())
        self.assertIn("bootstrap/project_operator.yaml", (self.target / "docs" / "OPERATOR_RUNBOOK.md").read_text(encoding="utf8"))
        self.assertIn("AGENTS.md", (self.target / "CLAUDE.md").read_text(encoding="utf8"))
        self.assertIn("pnpm ai:preflight:summary", (self.target / "CLAUDE.md").read_text(encoding="utf8"))
        self.assertIn("pnpm ai:command-gain --json", (self.target / "CLAUDE.md").read_text(encoding="utf8"))
        self.assertIn("pnpm ai:find:summary", (self.target / "CLAUDE.md").read_text(encoding="utf8"))
        self.assertIn("pnpm ai:read:summary", (self.target / "CLAUDE.md").read_text(encoding="utf8"))
        self.assertNotIn("/ai-efficiency", (self.target / "CLAUDE.md").read_text(encoding="utf8"))
        self.assertIn("三模式入口", (self.target / "docs" / "OPERATOR_RUNBOOK.md").read_text(encoding="utf8"))
        self.assertIn("Task Orchestration", (self.target / "docs" / "OPERATOR_RUNBOOK.md").read_text(encoding="utf8"))
        self.assertIn("GitHub 接入准备", (self.target / "docs" / "OPERATOR_RUNBOOK.md").read_text(encoding="utf8"))
        self.assertIn("pnpm ai:github-surface:summary", (self.target / "docs" / "OPERATOR_RUNBOOK.md").read_text(encoding="utf8"))
        self.assertIn("老项目接入 checklist", (self.target / "docs" / "OPERATOR_RUNBOOK.md").read_text(encoding="utf8"))
        self.assertIn("新项目 cold_start checklist", (self.target / "docs" / "OPERATOR_RUNBOOK.md").read_text(encoding="utf8"))
        self.assertIn("python3 scripts/init_project_compounding.py bootstrap --target . --mode=cold_start", (self.target / "docs" / "OPERATOR_RUNBOOK.md").read_text(encoding="utf8"))
        self.assertIn("pnpm ai:feature-context -- --surface=home", (self.target / "CLAUDE.md").read_text(encoding="utf8"))

    def test_github_surface_summary_reports_missing_remote_bootstrap_steps(self) -> None:
        self.init_git_repo()

        completed = self.run_script("scripts/ai/github-surface-summary.ts", "--json")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertFalse(payload["enabled"])
        self.assertEqual(payload["remoteName"], "origin")
        self.assertGreater(payload["missingCount"], 0)
        self.assertTrue(any(step["id"] == "remote_origin" and not step["done"] for step in payload["steps"]))
        self.assertTrue(any(step["id"] == "contract_identity" and not step["done"] for step in payload["steps"]))

    def test_validate_operator_contract_rejects_secret_like_refs(self) -> None:
        target = self.target / "bootstrap" / "project_operator.yaml"
        content = target.read_text(encoding="utf8")
        target.write_text(
            content.replace("secret_refs: []", "secret_refs:\n      - ghp_abcdefghijklmnopqrstuvwxyz123456", 1),
            encoding="utf8",
        )

        self.run_script("scripts/ai/generate-operator-assets.ts")
        completed = self.run_script("scripts/ai/validate-operator-contract.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertTrue(any("secret_refs" in error for error in payload["errors"]))

    def test_validate_operator_contract_rejects_invalid_shortcut_mode(self) -> None:
        target = self.target / "bootstrap" / "project_operator.yaml"
        content = target.read_text(encoding="utf8")
        target.write_text(content.replace("mode: suggest", "mode: rewrite", 1), encoding="utf8")

        self.run_script("scripts/ai/generate-operator-assets.ts")
        completed = self.run_script("scripts/ai/validate-operator-contract.ts")
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertTrue(any("Agent shortcut mode must be suggest" in error for error in payload["errors"]))

    def test_validate_operator_contract_allows_blank_task_commands_without_ai_exec_pack(self) -> None:
        target = self.target / "bootstrap" / "project_operator.yaml"
        content = target.read_text(encoding="utf8")
        replacements = {
            "    - ai_exec_pack\n": "",
            "  create: pnpm coord:task:create -- --taskId=t-xxx --summary=\\\"中文直给概述\\\" --why=\\\"为什么现在\\\"\n": "  create: \"\"\n",
            "  task_transition: pnpm coord:task:transition -- --taskId=t-xxx --event=block --reason=\\\"说明原因\\\"\n": "  task_transition: \"\"\n",
            "  review: pnpm coord:review:run -- --taskId=t-xxx\n": "  review: \"\"\n",
            "    create: pnpm coord:task:create -- --taskId=t-xxx --summary=\\\"中文直给概述\\\" --why=\\\"为什么现在\\\"\n": "    create: \"\"\n",
            "    start: pnpm coord:task:start -- --taskId=t-xxx\n": "    start: \"\"\n",
            "    handoff: pnpm coord:task:handoff -- --taskId=t-xxx\n": "    handoff: \"\"\n",
            "    review: pnpm coord:review:run -- --taskId=t-xxx\n": "    review: \"\"\n",
            "    override_transition: pnpm coord:task:transition -- --taskId=t-xxx --event=<event> --reason=\\\"说明原因\\\"\n": "    override_transition: \"\"\n",
        }
        for old, new in replacements.items():
            content = content.replace(old, new)
        target.write_text(content, encoding="utf8")
        shutil.copy(ROOT / "scripts" / "init_project_compounding.py", self.target / "scripts" / "init_project_compounding.py")

        generated = self.run_script("scripts/ai/generate-operator-assets.ts")
        self.assertEqual(generated.returncode, 0, msg=generated.stdout or generated.stderr)

        completed = self.run_script("scripts/ai/validate-operator-contract.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])

    def test_doctor_superpowers_reports_success_with_override_homes(self) -> None:
        self.init_git_repo()
        gitignore = self.target / ".gitignore"
        gitignore.write_text(gitignore.read_text(encoding="utf8") + "\n.worktrees/\n", encoding="utf8")
        codex_home = self.target / ".codex-home"
        agents_home = self.target / ".agents-home"
        skills_root = codex_home / "superpowers" / "skills"
        skills_root.mkdir(parents=True, exist_ok=True)
        git_dir = codex_home / "superpowers" / ".git"
        (git_dir / "refs" / "heads").mkdir(parents=True, exist_ok=True)
        (git_dir / "HEAD").write_text("ref: refs/heads/main\n", encoding="utf8")
        (git_dir / "refs" / "heads" / "main").write_text("1234567890abcdef1234567890abcdef12345678\n", encoding="utf8")
        for skill in [
            "using-superpowers",
            "brainstorming",
            "writing-plans",
            "subagent-driven-development",
            "verification-before-completion",
            "receiving-code-review",
            "requesting-code-review",
        ]:
            (skills_root / skill).mkdir(parents=True, exist_ok=True)
        (codex_home / "config.toml").write_text("[features]\nmulti_agent = true\n", encoding="utf8")
        overlay_dir = codex_home / "skills" / "compounding-operating-profile"
        overlay_dir.mkdir(parents=True, exist_ok=True)
        overlay_dir.joinpath("SKILL.md").write_text(
            "\n".join(
                [
                    "AGENTS.md",
                    "docs/AI_OPERATING_MODEL.md",
                    "docs/superpowers/specs/*",
                    "docs/superpowers/plans/*",
                    ".worktrees/",
                    "pnpm ai:doctor:superpowers",
                    "pnpm preflight -- --taskId=t-xxx",
                    "verification-before-completion",
                ]
            )
            + "\n",
            encoding="utf8",
        )
        (agents_home / "skills").mkdir(parents=True, exist_ok=True)
        os.symlink(skills_root, agents_home / "skills" / "superpowers")

        env = os.environ.copy()
        env["CODEX_HOME"] = str(codex_home)
        env["AGENTS_HOME"] = str(agents_home)
        completed = subprocess.run(
            ["node", "--experimental-strip-types", str(self.target / "scripts" / "ai" / "doctor-superpowers.ts"), "--json"],
            cwd=self.target,
            capture_output=True,
            text=True,
            env=env,
        )
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertTrue(payload["checks"]["clone_repo"]["ok"])
        self.assertEqual(payload["upstream_sha"], "1234567890abcdef1234567890abcdef12345678")
        self.assertTrue(payload["checks"]["skills_symlink"]["ok"])
        self.assertTrue(payload["checks"]["multi_agent"]["ok"])
        self.assertEqual(payload["checks"]["core_skills"]["missing"], [])
        self.assertTrue(payload["checks"]["overlay_skill"]["ok"])
        self.assertTrue(payload["checks"]["repo_mapping"]["ok"])
        self.assertTrue(payload["checks"]["worktree_standard"]["ok"])

    def test_doctor_superpowers_fails_when_required_skill_is_missing(self) -> None:
        self.init_git_repo()
        gitignore = self.target / ".gitignore"
        gitignore.write_text(gitignore.read_text(encoding="utf8") + "\n.worktrees/\n", encoding="utf8")
        codex_home = self.target / ".codex-home"
        agents_home = self.target / ".agents-home"
        skills_root = codex_home / "superpowers" / "skills"
        skills_root.mkdir(parents=True, exist_ok=True)
        git_dir = codex_home / "superpowers" / ".git"
        (git_dir / "refs" / "heads").mkdir(parents=True, exist_ok=True)
        (git_dir / "HEAD").write_text("ref: refs/heads/main\n", encoding="utf8")
        (git_dir / "refs" / "heads" / "main").write_text("1234567890abcdef1234567890abcdef12345678\n", encoding="utf8")
        for skill in [
            "using-superpowers",
            "brainstorming",
            "writing-plans",
            "verification-before-completion",
            "receiving-code-review",
            "requesting-code-review",
        ]:
            (skills_root / skill).mkdir(parents=True, exist_ok=True)
        (codex_home / "config.toml").write_text("[features]\nmulti_agent = true\n", encoding="utf8")
        overlay_dir = codex_home / "skills" / "compounding-operating-profile"
        overlay_dir.mkdir(parents=True, exist_ok=True)
        overlay_dir.joinpath("SKILL.md").write_text(
            "\n".join(
                [
                    "AGENTS.md",
                    "docs/AI_OPERATING_MODEL.md",
                    "docs/superpowers/specs/*",
                    "docs/superpowers/plans/*",
                    ".worktrees/",
                    "pnpm ai:doctor:superpowers",
                    "pnpm preflight -- --taskId=t-xxx",
                    "verification-before-completion",
                ]
            )
            + "\n",
            encoding="utf8",
        )
        (agents_home / "skills").mkdir(parents=True, exist_ok=True)
        os.symlink(skills_root, agents_home / "skills" / "superpowers")

        env = os.environ.copy()
        env["CODEX_HOME"] = str(codex_home)
        env["AGENTS_HOME"] = str(agents_home)
        completed = subprocess.run(
            ["node", "--experimental-strip-types", str(self.target / "scripts" / "ai" / "doctor-superpowers.ts"), "--json"],
            cwd=self.target,
            capture_output=True,
            text=True,
            env=env,
        )
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertFalse(payload["ok"])
        self.assertIn("subagent-driven-development", payload["checks"]["core_skills"]["missing"])
        self.assertTrue(payload["checks"]["overlay_skill"]["ok"])
        self.assertTrue(payload["checks"]["worktree_standard"]["ok"])

    def test_doctor_superpowers_requires_overlay_and_worktree_standard(self) -> None:
        self.init_git_repo()
        gitignore = self.target / ".gitignore"
        gitignore.write_text(gitignore.read_text(encoding="utf8").replace(".worktrees/\n", ""), encoding="utf8")
        codex_home = self.target / ".codex-home"
        agents_home = self.target / ".agents-home"
        skills_root = codex_home / "superpowers" / "skills"
        skills_root.mkdir(parents=True, exist_ok=True)
        git_dir = codex_home / "superpowers" / ".git"
        (git_dir / "refs" / "heads").mkdir(parents=True, exist_ok=True)
        (git_dir / "HEAD").write_text("ref: refs/heads/main\n", encoding="utf8")
        (git_dir / "refs" / "heads" / "main").write_text("1234567890abcdef1234567890abcdef12345678\n", encoding="utf8")
        for skill in [
            "using-superpowers",
            "brainstorming",
            "writing-plans",
            "subagent-driven-development",
            "verification-before-completion",
            "receiving-code-review",
            "requesting-code-review",
        ]:
            (skills_root / skill).mkdir(parents=True, exist_ok=True)
        (codex_home / "config.toml").write_text("[features]\nmulti_agent = true\n", encoding="utf8")
        (agents_home / "skills").mkdir(parents=True, exist_ok=True)
        os.symlink(skills_root, agents_home / "skills" / "superpowers")

        env = os.environ.copy()
        env["CODEX_HOME"] = str(codex_home)
        env["AGENTS_HOME"] = str(agents_home)
        completed = subprocess.run(
            ["node", "--experimental-strip-types", str(self.target / "scripts" / "ai" / "doctor-superpowers.ts"), "--json"],
            cwd=self.target,
            capture_output=True,
            text=True,
            env=env,
        )
        payload = json.loads(completed.stdout)

        self.assertNotEqual(completed.returncode, 0)
        self.assertFalse(payload["ok"])
        self.assertFalse(payload["checks"]["overlay_skill"]["ok"])
        self.assertFalse(payload["checks"]["worktree_standard"]["ok"])

    def test_validate_judgement_contract_smoke(self) -> None:
        self.init_git_repo()
        completed = self.run_script("scripts/ai/validate-judgement-contract.ts")
        payload = json.loads(completed.stdout)

        self.assertEqual(completed.returncode, 0, msg=completed.stdout or completed.stderr)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["layer"], "judgement-contract")
        self.assertIn("home", payload["details"]["checked_surfaces"])


if __name__ == "__main__":
    unittest.main()
