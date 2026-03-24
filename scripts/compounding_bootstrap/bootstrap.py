from __future__ import annotations

import shutil
from pathlib import Path

from .attach import attach
from .config_resolution import ensure_brief, infer_project_name
from .defaults import (
    AGENTS_PATH,
    BRIEF_PATH,
    EXPERIENCE_PROMOTION_TEMPLATE_PATH,
    KERNEL_MANIFEST_PATH,
    PROJECT_BRIEF_SCHEMA_PATH,
    PROJECT_BRIEF_TEMPLATE_PATH,
    SOURCE_ROOT,
)
from .yaml_io import save_yaml


def bootstrap(config_path: Path | None, target: Path) -> dict:
    project_name = infer_project_name(target)
    created: list[str] = []
    _copy_kernel_assets(target, created)
    _write_minimal_shell(target, project_name, created)
    brief_path, brief_payload, _ = ensure_brief(config_path or target / BRIEF_PATH, target, adoption_mode="new")
    brief_payload["kernel"]["adoption_mode"] = "new"
    save_yaml(brief_path, brief_payload)
    if "bootstrap/project_brief.yaml (normalized for new project)" not in created:
        created.append("bootstrap/project_brief.yaml (normalized for new project)")
    report = attach(brief_path, target, adoption_mode="new")
    report.setdefault("actions", {}).setdefault("created", []).extend(item for item in created if item not in report["actions"]["created"])
    return report


def _copy_if_missing(relative_path: str, target: Path, created: list[str]) -> None:
    source = SOURCE_ROOT / relative_path
    destination = target / relative_path
    if destination.exists():
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    created.append(relative_path)


def _copy_kernel_assets(target: Path, created: list[str]) -> None:
    for relative_path in (
        str(PROJECT_BRIEF_SCHEMA_PATH),
        "schemas/kernel_manifest.schema.yaml",
        "schemas/bootstrap_report.schema.yaml",
        "schemas/proposal.schema.yaml",
        "schemas/experience_promotion.schema.yaml",
        str(PROJECT_BRIEF_TEMPLATE_PATH),
        "templates/bootstrap_report.template.yaml",
        "templates/proposal.template.yaml",
        str(EXPERIENCE_PROMOTION_TEMPLATE_PATH),
        str(KERNEL_MANIFEST_PATH),
        "tasks/templates/task-template.md",
        "scripts/init_project_compounding.py",
    ):
        _copy_if_missing(relative_path, target, created)

    source_bootstrap_dir = SOURCE_ROOT / "scripts" / "compounding_bootstrap"
    target_bootstrap_dir = target / "scripts" / "compounding_bootstrap"
    target_bootstrap_dir.mkdir(parents=True, exist_ok=True)
    for source_path in sorted(source_bootstrap_dir.glob("*.py")) + sorted(source_bootstrap_dir.glob("*.md")):
        destination = target_bootstrap_dir / source_path.name
        if destination.exists():
            continue
        shutil.copyfile(source_path, destination)
        created.append(destination.relative_to(target).as_posix())


def _write_if_missing(target: Path, relative_path: str, content: str, created: list[str]) -> None:
    path = target / relative_path
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf8")
    created.append(relative_path)


def _write_minimal_shell(target: Path, project_name: str, created: list[str]) -> None:
    _write_if_missing(target, AGENTS_PATH, render_agents(project_name), created)
    for relative_path, content in minimal_shell_assets(project_name).items():
        _write_if_missing(target, relative_path, content, created)


def minimal_shell_assets(project_name: str) -> dict[str, str]:
    return {
        "docs/WORK_MODES.md": render_work_modes(),
        "docs/DEV_WORKFLOW.md": render_dev_workflow(),
        "docs/ARCHITECTURE.md": render_architecture(),
        "docs/PROJECT_RULES.md": render_project_rules(),
        "docs/AI_OPERATING_MODEL.md": render_ai_operating_model(),
        "docs/ASSET_MAINTENANCE.md": render_asset_maintenance(),
        "memory/project/roadmap.md": render_roadmap(project_name),
        "memory/project/current-state.md": render_current_state(),
        "memory/project/operating-blueprint.md": render_operating_blueprint(),
        "memory/project/tech-debt.md": render_tech_debt(),
        "tasks/queue/.gitkeep": "",
        "output/proposals/.gitkeep": "",
    }


def write_shell_asset(target: Path, relative_path: str, project_name: str) -> bool:
    content = minimal_shell_assets(project_name).get(relative_path)
    if content is None:
        return False
    _write_if_missing(target, relative_path, content, [])
    return True


def render_agents(project_name: str) -> str:
    return f"""# AGENTS

## 默认读链

- 先读 `AGENTS.md`
- 再读 `memory/project/roadmap.md`
- 再读 `memory/project/current-state.md`
- 再读 `memory/project/operating-blueprint.md`
- 需要工作模式时读 `docs/WORK_MODES.md`
- 需要执行顺序时读 `docs/DEV_WORKFLOW.md`
- 需要结构边界时读 `docs/ARCHITECTURE.md`

## 当前项目

- 名称：`{project_name}`
- 本仓默认采用 `single-kernel + project-shell`
- 需求未收口时回到 `memory/project/operating-blueprint.md`
- 执行事项进入 `tasks/queue/*`
"""


def render_work_modes() -> str:
    return """# 工作模式

## 总链

`提出需求 -> plan 收口 -> task 执行 -> release 验收 -> memory 回收`

## 原则

- 模糊事项留在 plan
- task 只承接可执行边界
- release 只承接验收与运行事实
"""


def render_dev_workflow() -> str:
    return """# 开发工作流

## 最小闭环

1. 先收口 plan
2. 再创建 task
3. 执行后更新 release / memory
4. 经验成熟后再考虑升格

## Kernel/Shell

- 先用 `attach` 接协议层
- 再用 `audit` 看缺口
- 再用 `proposal` 看升级建议
- 新项目先用 `bootstrap` 起最小壳子
"""


def render_architecture() -> str:
    return """# 架构

## 边界

- `kernel/`、`schemas/`、`templates/` 承载跨项目可升级资产
- `memory/project/*`、`tasks/queue/*`、业务代码承载项目壳子资产
- `output/*` 只承载生成结果
"""


def render_project_rules() -> str:
    return """# 项目规则

## 变更规则

- 不自动改核心业务代码
- 不自动改部署主入口
- 不自动改生产脚本
- 低风险协议层改动优先走 proposal
"""


def render_ai_operating_model() -> str:
    return """# AI 工作模型

## 原则

- 先 attach 进入协议层
- 先 audit 看边界和缺口
- proposal 先于 apply
- 经验默认留在项目壳子
"""


def render_asset_maintenance() -> str:
    return """# 资产维护

## 分类

- `kernel/*`、`schemas/*`、`templates/*`：跨项目可升级资产
- `memory/project/*`、`tasks/queue/*`：项目壳子资产
- `output/*`：生成物
"""


def render_roadmap(project_name: str) -> str:
    return f"""# 路线图

## 当前阶段

- `{project_name}` 已进入最小 project shell

## 近期目标

- 跑通 attach / audit / proposal / bootstrap
- 收敛项目自己的 plan / task / release / memory 协议
"""


def render_current_state() -> str:
    return """# 当前状态

## 关注点

- 当前处于最小 project shell
- 还未进入复杂升级或经验升格流程
"""


def render_operating_blueprint() -> str:
    return """# 运营蓝图

## 需求总览

- 把模糊事项留在 plan
- 把可执行事项写成 task
- 把交付事实留给 release
"""


def render_tech_debt() -> str:
    return """# 技术债

## 当前记录

- 暂无稳定技术债；后续按 task / release 复盘补充
"""


__all__ = ["bootstrap", "minimal_shell_assets", "write_shell_asset"]
