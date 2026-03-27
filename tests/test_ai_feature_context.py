import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

from tests.coord_support import ROOT


class FeatureContextCliTests(unittest.TestCase):
    def run_feature_context(self, *args: str) -> dict:
        completed = subprocess.run(
            ["node", "--experimental-strip-types", str(ROOT / "scripts/ai/feature-context.ts"), *args, "--json"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(completed.stdout)

    def test_home_surface_context_smoke(self) -> None:
        payload = self.run_feature_context("--surface=home")
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["target_surface"], "home")
        self.assertIn("portal", payload["related_modules"])
        self.assertIn("memory/project/roadmap.md", payload["must_read"])
        self.assertIn("project_judgement", payload)
        self.assertIn("default_flow", payload)
        self.assertTrue(payload["default_flow"]["entry_command"].startswith("pnpm ai:feature-context"))
        self.assertTrue(any(command.startswith("pnpm ai:find:summary") for command in payload["default_flow"]["summary_first_commands"]))
        self.assertTrue(any(command.startswith("pnpm ai:read:summary") for command in payload["default_flow"]["summary_first_commands"]))
        self.assertTrue(any(command.startswith("rg -n --hidden") for command in payload["default_flow"]["raw_fallback_commands"]))
        self.assertTrue(payload["project_judgement"]["recommendedSurface"]["href"].startswith("/"))

    def test_releases_route_context_smoke(self) -> None:
        payload = self.run_feature_context("--route=/releases")
        self.assertTrue(payload["ok"])
        self.assertIn("releases", payload["related_modules"])
        self.assertIn("delivery", payload["related_modules"])
        self.assertIn("docs/DEV_WORKFLOW.md", payload["must_read"])
        self.assertGreater(len(payload["required_checks"]), 0)
        self.assertGreater(len(payload["project_judgement"]["overallSummary"]), 0)
        self.assertIn("next_action", payload["default_flow"])

    def test_task_overlay_context_smoke(self) -> None:
        payload = self.run_feature_context("--taskPath=tasks/queue/task-066-feature-context-and-shared-state.md")
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["task_overlay"]["taskId"], "task-066-feature-context-and-shared-state")
        self.assertIn("deliveryTrack", payload["task_overlay"])
        self.assertIn("modeId", payload["task_overlay"])
        self.assertIn("tasks/queue/task-066-feature-context-and-shared-state.md", payload["must_read"])
        self.assertIn("tasks/queue/task-066-feature-context-and-shared-state.md", payload["likely_files"])
        self.assertIn("tasks/queue/task-066-feature-context-and-shared-state.md", payload["default_flow"]["entry_command"])
        self.assertTrue(any("t-066" in command for command in payload["default_flow"]["summary_first_commands"]))
        self.assertLessEqual(len(payload["must_read"]), 5)
        self.assertLessEqual(len(payload["read_on_demand"]), 5)
        self.assertLessEqual(len(payload["waste_alerts"]), 3)

    def test_build_context_balanced_and_expanded_modes(self) -> None:
        env = os.environ.copy()
        env["COMPOUNDING_SUMMARY_DISABLE_TRACKING"] = "0"
        task_path = "tasks/queue/task-066-feature-context-and-shared-state.md"

        default_run = subprocess.run(
            ["node", "--experimental-strip-types", str(ROOT / "scripts/ai/build-context.ts"), task_path],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
            env=env,
        )
        default_output_path = ROOT / default_run.stdout.strip()
        default_markdown = default_output_path.read_text(encoding="utf8")
        self.assertIn("## Must Read Now", default_markdown)
        self.assertIn("## Read On Demand", default_markdown)
        self.assertNotIn("## Expanded Excerpts", default_markdown)

        expanded_run = subprocess.run(
            ["node", "--experimental-strip-types", str(ROOT / "scripts/ai/build-context.ts"), task_path, "--expanded"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
            env=env,
        )
        expanded_output_path = ROOT / expanded_run.stdout.strip()
        expanded_markdown = expanded_output_path.read_text(encoding="utf8")
        self.assertIn("## Expanded Excerpts", expanded_markdown)


class FeatureContextChangeObservationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.target = Path(self.temp_dir.name)
        for relative in (
            "shared",
            "bootstrap",
            "scripts/ai/lib",
            "scripts/coord/lib",
            "memory/project",
            "apps/studio/src/modules/portal",
            "apps/studio/src/modules/releases",
            "docs",
        ):
            (self.target / relative).mkdir(parents=True, exist_ok=True)

        for relative in (
            "shared/git-changed-files.ts",
            "shared/module-feature-contract.ts",
            "shared/project-judgement.ts",
            "shared/ai-efficiency.ts",
            "shared/token-format.ts",
            "shared/task-cost.ts",
            "shared/task-contract.ts",
            "shared/task-identity.ts",
            "scripts/ai/lib/feature-context.ts",
            "scripts/ai/lib/change-policy.ts",
            "apps/studio/src/modules/releases/validation.ts",
            "bootstrap/heading_aliases.json",
        ):
            shutil.copy(ROOT / relative, self.target / relative)

        (self.target / "scripts/ai/lib/context-retro.ts").write_text(
            'module.exports = { buildContextRetroReport() { return { current_task: { alerts: [] } }; } };\n',
            encoding="utf8",
        )
        (self.target / "scripts/coord/lib/task-meta.ts").write_text(
            'module.exports = { readCompanion() { return null; } };\n',
            encoding="utf8",
        )

        self.write_file(
            "memory/project/current-state.md",
            "\n".join(
                [
                    "## 当前焦点",
                    "- 保持首页上下文稳定。",
                    "",
                    "## 当前阻塞",
                    "",
                    "## 下一检查点",
                    "- 验证 feature-context 只读 worktree。",
                    "",
                ]
            ),
        )
        self.write_file(
            "memory/project/roadmap.md",
            "\n".join(
                [
                    "## 当前阶段",
                    "Phase 2",
                    "",
                    "## 当前优先级",
                    "收口 feature-context 的改动观察输入。",
                    "",
                    "## 当前里程碑",
                    "Phase 2B 输入切换。",
                    "",
                    "## 里程碑成功标准",
                    "- clean tree 不再受 recent commit 污染。",
                    "- selectedChecks 保持原语义。",
                    "",
                ]
            ),
        )
        self.write_file(
            "memory/project/operating-blueprint.md",
            "\n".join(
                [
                    "## 计划总览",
                    "只切换 feature-context 的 changed_files 输入源。",
                    "",
                    "## 待思考事项",
                    "",
                    "## 待规划事项",
                    "",
                ]
            ),
        )
        self.write_file(
            "apps/studio/src/modules/portal/module.md",
            "\n".join(
                [
                    "# portal",
                    "",
                    "## 模块目标",
                    "首页模块负责展示项目状态摘要。",
                    "",
                    "## 入口与拥有面",
                    "- 页面: `/`",
                    "",
                    "## 常改文件",
                    "- `apps/studio/src/modules/portal/index.ts`",
                    "",
                    "## 不变量",
                    "- 首页入口仍可访问。",
                    "",
                    "## 推荐校验",
                    "",
                    "## 常见改动",
                    "- 更新首页数据展示。",
                    "",
                ]
            ),
        )
        self.write_file("apps/studio/src/modules/portal/index.ts", "export const portalTitle = 'home';\n")
        self.write_file("scripts/ai/sample.ts", "export const samplePromptVersion = 1;\n")
        self.write_file("docs/notes.md", "# Notes\n")
        self.init_git_repo()

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def write_file(self, relative_path: str, content: str) -> None:
        target = self.target / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf8")

    def init_git_repo(self) -> None:
        subprocess.run(["git", "init"], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "config", "user.name", "Test User"], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "add", "."], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "commit", "-m", "baseline"], cwd=self.target, check=True, capture_output=True, text=True)
        subprocess.run(["git", "branch", "-M", "main"], cwd=self.target, check=True, capture_output=True, text=True)

    def git(self, *args: str) -> None:
        subprocess.run(["git", *args], cwd=self.target, check=True, capture_output=True, text=True)

    def run_feature_context_packet(self) -> dict:
        code = "\n".join(
            [
                'const path = require("node:path");',
                'const { buildFeatureContextPacket } = require(path.join(process.cwd(), "scripts", "ai", "lib", "feature-context.ts"));',
                'const packet = buildFeatureContextPacket(process.cwd(), { surface: "home" });',
                "console.log(JSON.stringify(packet));",
            ]
        )
        completed = subprocess.run(
            ["node", "--experimental-strip-types", "-e", code],
            cwd=self.target,
            capture_output=True,
            text=True,
            check=True,
        )
        return json.loads(completed.stdout)

    def required_labels(self, payload: dict) -> list[str]:
        return [item["label"] for item in payload["required_checks"]]

    def recommended_labels(self, payload: dict) -> list[str]:
        return [item["label"] for item in payload["recommended_checks"]]

    def required_commands(self, payload: dict) -> list[list[str]]:
        return [item["commands"] for item in payload["required_checks"]]

    def recommended_commands(self, payload: dict) -> list[list[str]]:
        return [item["commands"] for item in payload["recommended_checks"]]

    def test_clean_tree_has_no_diff_aware_checks(self) -> None:
        payload = self.run_feature_context_packet()
        self.assertEqual(payload["required_checks"], [])
        self.assertEqual(payload["recommended_checks"], [])

    def test_clean_tree_ignores_recent_committed_structural_change(self) -> None:
        self.write_file("scripts/ai/sample.ts", "export const samplePromptVersion = 2;\n")
        self.git("add", "scripts/ai/sample.ts")
        self.git("commit", "-m", "update ai script")

        payload = self.run_feature_context_packet()
        self.assertEqual(payload["required_checks"], [])
        self.assertEqual(payload["recommended_checks"], [])

    def test_dirty_scripts_ai_change_keeps_static_build_ai_output_checks(self) -> None:
        self.write_file("scripts/ai/sample.ts", "export const samplePromptVersion = 2;\n")

        payload = self.run_feature_context_packet()
        self.assertEqual(self.required_labels(payload), ["静态门禁", "构建门禁", "AI 输出门禁"])
        self.assertEqual(self.required_commands(payload), [["pnpm lint"], ["pnpm build"], ["pnpm validate:ai-output"]])
        self.assertEqual(self.recommended_labels(payload), [])

    def test_dirty_docs_only_change_keeps_existing_check_shape(self) -> None:
        self.write_file("docs/notes.md", "# Notes\nUpdated\n")

        payload = self.run_feature_context_packet()
        self.assertEqual(self.required_labels(payload), ["静态门禁"])
        self.assertEqual(self.required_commands(payload), [["pnpm lint"]])
        self.assertEqual(self.recommended_labels(payload), [])

    def test_dirty_runtime_sensitive_change_keeps_build_and_runtime_checks(self) -> None:
        self.write_file("apps/studio/src/modules/portal/index.ts", "export const portalTitle = 'dashboard';\n")

        payload = self.run_feature_context_packet()
        self.assertEqual(self.required_labels(payload), ["静态门禁", "构建门禁"])
        self.assertEqual(self.required_commands(payload), [["pnpm lint"], ["pnpm build"]])
        self.assertEqual(self.recommended_labels(payload), ["运行时检查"])
        self.assertEqual(self.recommended_commands(payload), [["pnpm preview:check"]])
