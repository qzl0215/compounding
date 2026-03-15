from __future__ import annotations

from pathlib import Path
from typing import Any

from .config_resolution import load_yaml, migrate_legacy_config, resolve_project_config, save_yaml, validate_brief_payload
from .defaults import AGENTS_PATH, BRIEF_PATH, DOC_META, RESOLVED_CONFIG_PATH
from .document_renderers import (
    render_adr,
    render_agents,
    render_ai_operating_model,
    render_architecture,
    render_current_state,
    render_dependency_map,
    render_dev_workflow,
    render_experience_entry,
    render_experience_readme,
    render_function_index_json,
    render_module_index,
    render_project_rules,
    render_readme,
    render_refactor_plan,
    render_roadmap,
    render_system_overview,
    render_tech_debt,
)
from .managed_blocks import write_managed_document
from .scaffold_assets import render_ai_scripts, render_manifest, render_pull_request_template, render_task_template, task_001


def scaffold(config_path: Path, target: Path) -> None:
    brief_path = config_path if config_path.exists() else target / BRIEF_PATH
    if not brief_path.exists():
        brief_path = migrate_legacy_config(target)
    payload = load_yaml(brief_path)
    validation = validate_brief_payload(payload)
    if not validation["ok"]:
        raise ValueError(validation["message"])

    resolved = resolve_project_config(brief_path, target)
    save_yaml(target / RESOLVED_CONFIG_PATH, resolved)
    archive_legacy_docs(target)
    render_markdown_docs(target, resolved)
    render_plain_files(target, resolved)


def archive_legacy_docs(target: Path) -> None:
    legacy_roots = ["reference", "operations", "planning", "memory"]
    archive_root = target / "docs" / "archive" / "v2-pre-ai-native"
    archive_root.mkdir(parents=True, exist_ok=True)
    for name in legacy_roots:
        legacy = target / "docs" / name
        destination = archive_root / name
        if legacy.exists() and not destination.exists():
            legacy.rename(destination)


def render_markdown_docs(target: Path, resolved: dict[str, Any]) -> None:
    block_map = {
        AGENTS_PATH: render_agents(resolved),
        "docs/PROJECT_RULES.md": render_project_rules(),
        "docs/ARCHITECTURE.md": render_architecture(resolved),
        "docs/DEV_WORKFLOW.md": render_dev_workflow(),
        "docs/AI_OPERATING_MODEL.md": render_ai_operating_model(),
        "docs/REFACTOR_PLAN.md": render_refactor_plan(resolved),
        "memory/architecture/system-overview.md": render_system_overview(),
        "memory/project/current-state.md": render_current_state(resolved),
        "memory/project/tech-debt.md": render_tech_debt(),
        "memory/project/roadmap.md": render_roadmap(resolved),
        "memory/experience/README.md": render_experience_readme(),
        "memory/experience/exp-001-thin-agents-entry.md": render_experience_entry(
            "保持 AGENTS 轻入口",
            "AGENTS 曾长期承载过多正文，导致每个线程都要吞下过重上下文。",
            "把 AGENTS 收口成薄入口，只保留高频执行约束和必读清单。",
            "这样最符合 Codex 的天然入口读取模式，也降低主源污染风险。",
            "新线程更快进入有效上下文，主源更新频率更健康。",
            "若未来再出现高频长文倾向，应优先压回 docs / memory，而不是继续加重 AGENTS。",
        ),
        "memory/experience/exp-002-memory-before-promotion.md": render_experience_entry(
            "先记忆，再升格",
            "经验如果直接升格进主规则，往往会把一次性判断写成长期规则。",
            "先写 memory，再验证，再决定是否升格。",
            "这能避免主规则快速膨胀，也让经验拥有可追溯来源。",
            "仓库更容易产生复利，而不是越记越乱。",
            "所有暂未稳定的经验都应该先进入 memory/experience。",
        ),
        "memory/experience/exp-003-delete-legacy-ui-first.md": render_experience_entry(
            "先删除半活旧前台",
            "当前仓库曾经存在大量已退役的 workflow 页面和 API。",
            "优先删除半活前台，再谈新骨架。",
            "对 AI 来说，错误入口比缺入口更糟。",
            "清理后只剩首页和文档页，Studio 角色更清楚。",
            "以后凡是退役前台，都应该先从构建入口清掉，再决定是否归档。",
        ),
        "memory/decisions/ADR-001-ai-native-repo-skeleton.md": render_adr(
            "ADR-001 AI-Native Repo 骨架",
            "仓库需要从“文档产品 + 旧 workflow 前台 + 巨型引擎”收敛为适合 AI 长期协作的结构。",
            "采用 `AGENTS + docs + memory + code_index + tasks + scripts/ai` 的骨架，并以 Studio 只读门户做可视化入口。",
            "这让规则、状态、记忆、上下文和任务各有归宿，同时避免再建平行体系。",
        ),
        "memory/decisions/ADR-002-thin-agents-entry-contract.md": render_adr(
            "ADR-002 AGENTS 轻入口合约",
            "Codex 线程天然会读 AGENTS.md，但不保证额外跳转总是发生。",
            "把 AGENTS 定义为薄入口合约，而不是长篇规则文档。",
            "这样可以同时保证入口约束力和长期可维护性。",
        ),
        "memory/decisions/ADR-003-no-new-giant-utils.md": render_adr(
            "ADR-003 禁止新增巨型工具层",
            "历史上巨型 util / helper 常成为无边界逻辑堆积点。",
            "禁止继续扩张这类命名和承载层，优先按能力拆到清晰模块。",
            "这样可以降低 AI 理解成本，也让并行修改的冲突更少。",
        ),
        "code_index/module-index.md": render_module_index(resolved["repo_scan"]),
        "code_index/dependency-map.md": render_dependency_map(),
    }
    for relative_path, block_content in block_map.items():
        meta = build_meta(relative_path)
        suffix = "## 人工备注\n\n人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。" if relative_path == AGENTS_PATH else ""
        write_managed_document(target / relative_path, meta, block_content, suffix)


def render_plain_files(target: Path, resolved: dict[str, Any]) -> None:
    (target / "README.md").write_text(render_readme(resolved), encoding="utf8")
    render_ai_scripts(target)
    (target / "code_index" / "function-index.json").parent.mkdir(parents=True, exist_ok=True)
    (target / "code_index" / "function-index.json").write_text(render_function_index_json(target), encoding="utf8")
    render_task_template(target)
    (target / "tasks" / "queue" / "task-001-repo-refactor.md").parent.mkdir(parents=True, exist_ok=True)
    (target / "tasks" / "queue" / "task-001-repo-refactor.md").write_text(task_001(resolved), encoding="utf8")
    (target / "tasks" / "archive" / ".gitkeep").parent.mkdir(parents=True, exist_ok=True)
    (target / "tasks" / "archive" / ".gitkeep").write_text("", encoding="utf8")
    render_pull_request_template(target)
    render_manifest(target)


def build_meta(relative_path: str) -> dict[str, Any]:
    meta = dict(DOC_META[relative_path])
    meta.setdefault("status", "active")
    meta.setdefault("related_docs", [])
    meta.setdefault("doc_role", "reference")
    meta.setdefault("update_mode", "manual")
    meta.setdefault("source_of_truth", AGENTS_PATH)
    return meta
