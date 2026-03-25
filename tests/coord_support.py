import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TASK_TEMPLATE_PATH = ROOT / "tasks" / "templates" / "task-template.md"


def render_task_template(values: dict[str, str], template_path: Path = TASK_TEMPLATE_PATH) -> str:
    merged = {
        "task_id": "task-999-sample",
        "short_id": "t-999",
        "parent_plan": "memory/project/operating-blueprint.md",
        "summary": "验证 companion lifecycle。",
        "why_now": "需要确认 companion 生命周期与 release handoff 还能围绕统一合同运作。",
        "boundary": "只验证 task companion、review 与 release handoff 的闭环，不扩到页面投影。",
        "done_when": "companion 生命周期记录完整，且 release context 能优先读取 companion handoff。",
        "in_scope": "- 验证 companion 初始化与生命周期回写。\n- 验证 release handoff 读取逻辑。",
        "out_of_scope": "- 不测试 UI 页面。\n- 不测试真实 release 切换。",
        "constraints": "- 保持 task 文档为执行合同，机器事实下沉到 companion。",
        "risk": "- 若 contract 解析漂移，会重新长出第二套状态表。",
        "test_reason": "需要锁住 companion 生命周期与 release context 的兼容性。",
        "test_scope": "companion 初始化、pre-task/review/release handoff 回写，以及 release context 读取。",
        "test_skip": "不做页面层或真实发布链验证。",
        "test_roi": "先保护最容易断裂的 coordination 主链。",
        "status": "doing",
        "acceptance_result": "待验收",
        "delivery_result": "让 review 与 release 可以复用同一份 companion。",
        "retro": "未复盘",
        "current_mode": "工程执行",
        "branch": "codex/task-999-sample",
        "related_modules": "",
        "update_trace_memory": "no change: 未更新",
        "update_trace_index": "no change: 未更新",
        "update_trace_roadmap": "no change: 未更新",
        "update_trace_docs": "no change: 未更新",
    }
    merged.update(values)
    content = template_path.read_text(encoding="utf8")
    for key, value in merged.items():
        content = content.replace(f"{{{{{key}}}}}", value)
    return content

SAMPLE_TASK_MARKDOWN = render_task_template({})


class CoordCliTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.target = Path(self.temp_dir.name)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "tasks" / "templates").mkdir(parents=True, exist_ok=True)
        (self.target / "shared").mkdir(parents=True, exist_ok=True)
        (self.target / "bootstrap").mkdir(parents=True, exist_ok=True)
        shutil.copy(ROOT / "shared" / "task-identity.ts", self.target / "shared" / "task-identity.ts")
        shutil.copy(ROOT / "shared" / "task-contract.ts", self.target / "shared" / "task-contract.ts")
        shutil.copy(ROOT / "shared" / "module-feature-contract.ts", self.target / "shared" / "module-feature-contract.ts")
        shutil.copy(ROOT / "shared" / "feature-context.ts", self.target / "shared" / "feature-context.ts")
        shutil.copy(ROOT / "bootstrap" / "heading_aliases.json", self.target / "bootstrap" / "heading_aliases.json")
        shutil.copy(TASK_TEMPLATE_PATH, self.target / "tasks" / "templates" / "task-template.md")
        (self.target / "tasks" / "queue" / "task-999-sample.md").write_text(SAMPLE_TASK_MARKDOWN, encoding="utf8")

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def run_node(self, code: str) -> dict:
        completed = subprocess.run(
            ["node", "--experimental-strip-types", "-e", code],
            cwd=self.target,
            check=True,
            capture_output=True,
            text=True,
        )
        return json.loads(completed.stdout)

    def run_script(self, relative_script: str, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["node", "--experimental-strip-types", str(ROOT / relative_script), *args],
            cwd=self.target,
            capture_output=True,
            text=True,
        )

    def init_git_repo(self) -> None:
        subprocess.run(["git", "init"], cwd=self.target, check=True)
        subprocess.run(["git", "config", "user.name", "Test User"], cwd=self.target, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=self.target, check=True)
        subprocess.run(["git", "add", "."], cwd=self.target, check=True)
        subprocess.run(["git", "commit", "-m", "baseline"], cwd=self.target, check=True)

    def install_preflight_fixtures(self, *, scope_pass: bool = True) -> None:
        scripts_dir = self.target / "scripts"
        coord_dir = scripts_dir / "coord"
        runtime_dir = scripts_dir / "local-runtime"
        scope_summary = "范围通过" if scope_pass else "范围阻塞"
        scripts_dir.mkdir(parents=True, exist_ok=True)
        coord_dir.mkdir(parents=True, exist_ok=True)
        runtime_dir.mkdir(parents=True, exist_ok=True)

        shutil.copy(ROOT / "scripts" / "pre_mutation_check.py", scripts_dir / "pre_mutation_check.py")

        (coord_dir / "scope-guard.ts").write_text(
            (
                'console.log(JSON.stringify({'
                f'"ok": {str(scope_pass).lower()}, '
                f'"pass": {str(scope_pass).lower()}, '
                '"scope_risk_score": 0, '
                f'"scope_summary": "{scope_summary}", '
                '"planned_files": ["tasks/queue/task-999-sample.md"], '
                '"actual_files": ["tasks/queue/task-999-sample.md"], '
                '"undeclared": [], '
                '"high_risk_undeclared": [], '
                '"declared_but_unchanged": []'
                '}));\n'
            ),
            encoding="utf8",
        )

        runtime_payload = json.dumps(
            {
                "ok": True,
                "status": "running",
                "running": True,
                "port": 3010,
                "pid": 1234,
                "runtime_release_id": "runtime-sample",
                "current_release_id": "runtime-sample",
                "drift": False,
                "reason": "",
            },
            ensure_ascii=False,
        )
        for filename in ("status-prod.ts", "status-preview.ts"):
            (runtime_dir / filename).write_text(f"console.log('{runtime_payload}');\n", encoding="utf8")
