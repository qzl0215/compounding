from __future__ import annotations

import re
from pathlib import Path

from .config_resolution import load_yaml, migrate_legacy_config, validate_brief_payload
from .defaults import (
    AGENTS_PATH,
    AI_SCRIPT_PATHS,
    BRIEF_PATH,
    CANONICAL_DOCS,
    CODE_INDEX_DOCS,
    LEGACY_TERMS,
    MEMORY_DOCS,
    REQUIRED_FRONTMATTER,
    SCAFFOLD_PATHS,
    TASK_DOCS,
    AuditResult,
)
from .managed_blocks import split_frontmatter


def audit(config_path: Path, target: Path) -> AuditResult:
    result = AuditResult(passed=True)
    brief_path = config_path if config_path.exists() else target / BRIEF_PATH
    if not brief_path.exists():
        brief_path = migrate_legacy_config(target)
    payload = load_yaml(brief_path)
    validation = validate_brief_payload(payload)
    if not validation["ok"]:
        result.errors.extend(f"{field}: {message}" for field, message in validation["field_errors"].items())

    for relative_path in SCAFFOLD_PATHS:
        path = target / relative_path
        if not path.exists():
            result.missing_assets.append(relative_path)
            continue
        result.checked_files.append(relative_path)
        if path.is_file() and path.suffix in {".md", ".ts", ".json"} and not path.read_text(encoding="utf8").strip() and path.name != ".gitkeep":
            result.errors.append(f"{relative_path} is empty.")

    legacy_live_paths = [
        "docs/reference",
        "docs/operations",
        "docs/planning",
        "docs/memory",
    ]
    for relative_path in legacy_live_paths:
        if (target / relative_path).exists():
            result.errors.append(f"Legacy live docs path still exists: {relative_path}")

    agents_path = target / AGENTS_PATH
    roadmap_path = target / "memory/project/roadmap.md"
    if agents_path.exists():
        agents_text = agents_path.read_text(encoding="utf8")
        for required in [
            "`docs/PROJECT_RULES.md`",
            "`docs/ARCHITECTURE.md`",
            "`docs/DEV_WORKFLOW.md`",
            "`docs/AI_OPERATING_MODEL.md`",
        ]:
            if required not in agents_text:
                result.errors.append(f"AGENTS must require reading {required}.")
        if "`memory/project/roadmap.md`" not in agents_text:
            result.errors.append("AGENTS Current State must point to memory/project/roadmap.md as the planning source.")

    if agents_path.exists() and roadmap_path.exists():
        agents_priority = extract_value(agents_path.read_text(encoding="utf8"), "当前优先级")
        roadmap_priority = extract_heading_block(roadmap_path.read_text(encoding="utf8"), "Current Priority")
        if agents_priority and roadmap_priority and agents_priority.strip() != roadmap_priority.strip():
            result.errors.append("AGENTS current priority must mirror roadmap current priority.")

    for relative_path in [AGENTS_PATH, *CANONICAL_DOCS, *MEMORY_DOCS, "code_index/module-index.md", "code_index/dependency-map.md"]:
        path = target / relative_path
        if not path.exists():
            continue
        meta, _ = split_frontmatter(path.read_text(encoding="utf8"))
        missing = [field for field in REQUIRED_FRONTMATTER if field not in meta]
        if missing:
            result.errors.append(f"{relative_path} missing frontmatter fields: {', '.join(missing)}")

    memory_readme = target / "memory/experience/README.md"
    if memory_readme.exists():
        memory_text = memory_readme.read_text(encoding="utf8")
        if "## Promotion Candidates" not in memory_text:
            result.errors.append("memory/experience/README.md missing section: ## Promotion Candidates")

    task_template = target / "tasks/templates/task-template.md"
    if task_template.exists():
        template_text = task_template.read_text(encoding="utf8")
        for heading in [
            "## Goal",
            "## Why",
            "## Scope",
            "## Out of Scope",
            "## Constraints",
            "## Related Modules",
            "## Acceptance Criteria",
            "## Risks",
            "## Status",
        ]:
            if heading not in template_text:
                result.errors.append(f"task template missing heading: {heading}")

    for relative_path in [AGENTS_PATH, *CANONICAL_DOCS, *MEMORY_DOCS]:
        path = target / relative_path
        if not path.exists():
            continue
        text = path.read_text(encoding="utf8")
        for term in LEGACY_TERMS:
            if term in text:
                result.hardcoded_legacy_terms.append(f"{relative_path}: {term}")

    if result.missing_assets:
        result.errors.append(f"Missing required assets: {', '.join(result.missing_assets)}")
    if result.hardcoded_legacy_terms:
        result.errors.extend(f"Legacy term leaked: {item}" for item in result.hardcoded_legacy_terms)
    result.passed = not result.errors
    return result


def extract_value(text: str, label: str) -> str | None:
    match = re.search(rf"- {re.escape(label)}：(.*)", text)
    return match.group(1).strip() if match else None


def extract_heading_block(text: str, heading: str) -> str | None:
    match = re.search(rf"## {re.escape(heading)}\n\n([\s\S]*?)(?=\n## |\Z)", text)
    return match.group(1).strip() if match else None
