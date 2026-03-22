import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

SAMPLE_TASK_MARKDOWN = """# 示例任务

## 短编号

t-999

## 目标

验证 companion lifecycle。

## 关联模块

- `scripts/coord/task.ts`
- `tasks/queue/task-999-sample.md`

## 当前模式

工程执行

## 分支

`codex/task-999-sample`

## 交付收益

让 review 与 release 可以复用同一份 companion。

## 交付风险

若 contract 漂移，会重新长出第二套状态表。

## 状态

doing
"""


class CoordCliTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.target = Path(self.temp_dir.name)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "shared").mkdir(parents=True, exist_ok=True)
        (self.target / "bootstrap").mkdir(parents=True, exist_ok=True)
        shutil.copy(ROOT / "shared" / "task-identity.ts", self.target / "shared" / "task-identity.ts")
        shutil.copy(ROOT / "bootstrap" / "heading_aliases.json", self.target / "bootstrap" / "heading_aliases.json")
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
