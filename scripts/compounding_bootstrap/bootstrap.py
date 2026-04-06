from __future__ import annotations

import shutil
from pathlib import Path

from .attach import attach
from .config_resolution import ensure_brief, infer_app_type, infer_kernel_profile, infer_project_name
from .defaults import (
    AGENTS_PATH,
    BRIEF_PATH,
    EXPERIENCE_PROMOTION_TEMPLATE_PATH,
    KERNEL_MANIFEST_PATH,
    PROJECT_OPERATOR_SCHEMA_PATH,
    PROJECT_OPERATOR_TEMPLATE_PATH,
    PROJECT_BRIEF_SCHEMA_PATH,
    PROJECT_BRIEF_TEMPLATE_PATH,
    SOURCE_ROOT,
)
from .operator_contract import ensure_operator_contract, sync_operator_assets
from .packs import infer_adapter_id, infer_bootstrap_mode, load_kernel_manifest, mode_required_packs, resolve_supported_mode, selected_pack_paths
from .yaml_io import save_yaml


def bootstrap(config_path: Path | None, target: Path, bootstrap_mode: str = "cold_start") -> dict:
    project_name = infer_project_name(target)
    created: list[str] = []
    manifest = load_kernel_manifest()
    inferred_app_type = infer_app_type(target)
    inferred_profile = infer_kernel_profile(target, inferred_app_type)
    resolved_mode = resolve_supported_mode(
        manifest,
        infer_adapter_id(inferred_app_type),
        bootstrap_mode,
        infer_bootstrap_mode(target, inferred_app_type, inferred_profile),
    )
    pack_ids = mode_required_packs(manifest, resolved_mode)
    _copy_kernel_assets(target, created, selected_pack_paths(manifest, pack_ids, "copy_paths"))
    _write_minimal_shell(target, project_name, created)
    brief_path, brief_payload, _ = ensure_brief(config_path or target / BRIEF_PATH, target, adoption_mode="new", bootstrap_mode=resolved_mode)
    brief_payload["kernel"]["adoption_mode"] = "new"
    save_yaml(brief_path, brief_payload)
    if "bootstrap/project_brief.yaml (normalized for new project)" not in created:
        created.append("bootstrap/project_brief.yaml (normalized for new project)")
    operator_path, _, operator_changed = ensure_operator_contract(target)
    if operator_changed:
        created.append(f"{operator_path.relative_to(target).as_posix()} (created or normalized)")
    if "tooling_pack" in pack_ids and sync_operator_assets(target):
        created.append("docs/OPERATOR_RUNBOOK.md / CLAUDE.md / OPENCODE.md / .cursor/rules/00-project-entry.mdc (generated)")
    report = attach(brief_path, target, adoption_mode="new", bootstrap_mode=resolved_mode)
    report.setdefault("actions", {}).setdefault("created", []).extend(item for item in created if item not in report["actions"]["created"])
    return report


def _copy_if_missing(relative_path: str, target: Path, created: list[str]) -> None:
    if "*" in relative_path:
        for source in sorted(SOURCE_ROOT.glob(relative_path)):
            if not source.is_file():
                continue
            resolved = source.relative_to(SOURCE_ROOT).as_posix()
            destination = target / resolved
            if destination.exists():
                continue
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, destination)
            created.append(resolved)
        return
    source = SOURCE_ROOT / relative_path
    destination = target / relative_path
    if destination.exists():
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    created.append(relative_path)


def _copy_kernel_assets(target: Path, created: list[str], copy_paths: list[str]) -> None:
    for relative_path in copy_paths:
        _copy_if_missing(relative_path, target, created)


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
        "memory/project/goals.md": render_goals(project_name),
        "memory/project/current-state.md": render_current_state(),
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
- 再读 `memory/project/goals.md`
- 再读 `memory/project/current-state.md`
- 需要工作模式时读 `docs/WORK_MODES.md`
- 需要执行顺序时读 `docs/DEV_WORKFLOW.md`
- 需要结构边界时读 `docs/ARCHITECTURE.md`
- 需要服务器 / GitHub / 发布访问面时读 `bootstrap/project_operator.yaml`

## 当前项目

- 名称：`{project_name}`
- 本仓默认采用 `single-kernel + project-shell`
- 需求未收口时回到 `memory/project/goals.md`
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
- 服务器、GitHub 和标准发布流统一写在 `bootstrap/project_operator.yaml`
"""


def render_architecture() -> str:
    return """# 架构

## 边界

- core：`apps/studio/src/app/*`、`apps/studio/src/components/*`、`apps/studio/src/lib/*`、`apps/studio/src/modules/*`、`scripts/ai/*`、`scripts/coord/*`、`scripts/local-runtime/*`、`scripts/release/*`、`shared/*`
- bootstrap：`scripts/compounding_bootstrap/*`、`scripts/init_project_compounding.py`、`kernel/kernel_manifest.yaml`、`bootstrap/*`、`schemas/*`、`templates/*`
- config：`package.json`、`pnpm-workspace.yaml`、`apps/studio/*.config.*`、`.github/*`、`.cursor/rules/*`、`CLAUDE.md`、`OPENCODE.md`、`docs/OPERATOR_RUNBOOK.md`
- governance / knowledge：`AGENTS.md`、`docs/*`、`memory/*`、`tasks/*`、`code_index/*`
- derived / runtime：`output/*`、`.compounding-runtime/*`、`.next/*`、`node_modules/*`

## 规则

- core 负责产品和执行内核
- bootstrap 负责装配、生成与契约
- config 负责工具链和入口契约
- governance / knowledge 负责主源与经验
- derived / runtime 只做派生物，不反向充当主源
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
- 涉及服务器 / GitHub / 发布访问面时先读 `bootstrap/project_operator.yaml`
"""


def render_asset_maintenance() -> str:
    return """# 资产维护

## 分类

- core：产品与执行内核
- bootstrap：装配、生成与契约
- config：工具链与入口契约
- governance / knowledge：主源、记忆与经验
- derived / runtime：生成物与运行态

## 边界

- `output/*`、`.compounding-runtime/*`、`.next/*`、`node_modules/*` 只承载派生结果
- `docs/ARCHITECTURE.md` 是仓内分类口径的主说明
- 新的分类若要外化到别的项目，先更新 bootstrap 生成链，再回写文档主源
"""


def render_goals(project_name: str) -> str:
    return f"""# 目标

## 当前阶段

- `{project_name}` 已进入最小 project shell

## 当前优先级

- 跑通 attach / audit / proposal / bootstrap

## 里程碑成功标准

- [ ] 完成 bootstrap 骨架
- [ ] 验证 preflight 通过

## 当前里程碑

- 初始化阶段
"""


def render_current_state() -> str:
    return """# 当前状态

## 关注点

- 当前处于最小 project shell
- 还未进入复杂升级或经验升格流程
"""


def render_tech_debt() -> str:
    return """# 技术债

## 当前记录

- 暂无稳定技术债；后续按 task / release 复盘补充
"""


__all__ = ["bootstrap", "minimal_shell_assets", "write_shell_asset"]
