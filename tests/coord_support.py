import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

SAMPLE_TASK_MARKDOWN = """# 示例任务

## 任务摘要

- 短编号：`t-999`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  验证 companion lifecycle。
- 为什么现在：
  需要确认 companion 生命周期与 release handoff 还能围绕统一合同运作。
- 承接边界：
  只验证 task companion、review 与 release handoff 的闭环，不扩到页面投影。
- 完成定义：
  companion 生命周期记录完整，且 release context 能优先读取 companion handoff。

## 执行合同

### 要做

- 验证 companion 初始化与生命周期回写。
- 验证 release handoff 读取逻辑。

### 不做

- 不测试 UI 页面。
- 不测试真实 release 切换。

### 约束

- 保持 task 文档为执行合同，机器事实下沉到 companion。

### 关键风险

- 若 contract 解析漂移，会重新长出第二套状态表。

### 测试策略

- 为什么测：需要锁住 companion 生命周期与 release context 的兼容性。
- 测什么：companion 初始化、pre-task/review/release handoff 回写，以及 release context 读取。
- 不测什么：不做页面层或真实发布链验证。
- 当前最小集理由：先保护最容易断裂的 coordination 主链。

## 交付结果

- 状态：doing
- 体验验收结果：
  待验收
- 交付结果：
  让 review 与 release 可以复用同一份 companion。
- 复盘：
  未复盘
"""


class CoordCliTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.target = Path(self.temp_dir.name)
        (self.target / "tasks" / "queue").mkdir(parents=True, exist_ok=True)
        (self.target / "shared").mkdir(parents=True, exist_ok=True)
        (self.target / "bootstrap").mkdir(parents=True, exist_ok=True)
        shutil.copy(ROOT / "shared" / "task-identity.ts", self.target / "shared" / "task-identity.ts")
        shutil.copy(ROOT / "shared" / "task-contract.ts", self.target / "shared" / "task-contract.ts")
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
