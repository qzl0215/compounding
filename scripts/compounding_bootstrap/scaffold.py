from __future__ import annotations

from pathlib import Path
from typing import Any

from .config_resolution import load_yaml, migrate_legacy_config, resolve_project_config, save_yaml, validate_brief_payload
from .defaults import BRIEF_PATH, RESOLVED_CONFIG_PATH
from .managed_blocks import split_frontmatter, write_managed_document
from .renderers_index import render_dependency_map, render_function_index_json, render_module_index
from .scaffold_assets import (
    copy_canonical_file,
    render_ai_scripts,
    render_manifest,
    render_prompt_docs,
    render_pull_request_template,
    render_task_template,
    sync_canonical_managed_document,
)


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
    managed_docs = [
        "AGENTS.md",
        "docs/PROJECT_RULES.md",
        "docs/ARCHITECTURE.md",
        "docs/WORK_MODES.md",
        "docs/DEV_WORKFLOW.md",
        "docs/AI_OPERATING_MODEL.md",
        "docs/ASSET_MAINTENANCE.md",
        "memory/architecture/system-overview.md",
        "memory/project/current-state.md",
        "memory/project/operating-blueprint.md",
        "memory/project/tech-debt.md",
        "memory/project/roadmap.md",
        "memory/experience/README.md",
        "memory/experience/exp-001-thin-agents-entry.md",
        "memory/experience/exp-002-memory-before-promotion.md",
        "memory/experience/exp-003-delete-legacy-ui-first.md",
        "memory/decisions/ADR-001-ai-native-repo-skeleton.md",
        "memory/decisions/ADR-002-thin-agents-entry-contract.md",
        "memory/decisions/ADR-003-no-new-giant-utils.md",
    ]
    for relative_path in managed_docs:
        sync_canonical_managed_document(target, relative_path)

    generated_docs = {
        "code_index/module-index.md": render_module_index(resolved["repo_scan"]),
        "code_index/dependency-map.md": render_dependency_map(),
    }
    for relative_path, content in generated_docs.items():
        source_path = Path(__file__).resolve().parents[2] / relative_path
        meta, _ = split_frontmatter(source_path.read_text(encoding="utf8"))
        write_managed_document(target / relative_path, meta, content)


def render_plain_files(target: Path, resolved: dict[str, Any]) -> None:
    copy_canonical_file(target, "README.md")
    render_ai_scripts(target)
    (target / "code_index" / "function-index.json").parent.mkdir(parents=True, exist_ok=True)
    (target / "code_index" / "function-index.json").write_text(render_function_index_json(target), encoding="utf8")
    render_task_template(target)
    render_prompt_docs(target)
    copy_canonical_file(target, "tasks/queue/task-001-repo-refactor.md")
    (target / "tasks" / "archive" / ".gitkeep").parent.mkdir(parents=True, exist_ok=True)
    (target / "tasks" / "archive" / ".gitkeep").write_text("", encoding="utf8")
    render_pull_request_template(target)
    render_manifest(target)
