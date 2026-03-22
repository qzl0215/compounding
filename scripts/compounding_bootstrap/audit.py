from __future__ import annotations

import json
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


def has_bundled_source_of_truth(value: object) -> bool:
    return bool(re.search(r"[+,，]", str(value or "")))


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
        if "- 计划主源：`memory/project/operating-blueprint.md`" not in agents_text:
            result.errors.append("AGENTS truth map must declare memory/project/operating-blueprint.md as the single plan source.")

    for relative_path in [AGENTS_PATH, *CANONICAL_DOCS, *MEMORY_DOCS, "code_index/module-index.md", "code_index/dependency-map.md"]:
        path = target / relative_path
        if not path.exists():
            continue
        meta, _ = split_frontmatter(path.read_text(encoding="utf8"))
        missing = [field for field in REQUIRED_FRONTMATTER if field not in meta]
        if missing:
            result.errors.append(f"{relative_path} missing frontmatter fields: {', '.join(missing)}")
        if has_bundled_source_of_truth(meta.get("source_of_truth")):
            result.errors.append(f"{relative_path} must use a single source_of_truth owner.")

    memory_readme = target / "memory/experience/README.md"
    if memory_readme.exists():
        memory_text = memory_readme.read_text(encoding="utf8")
        if not extract_heading_block(target, memory_text, "promotion_candidates"):
            result.errors.append("memory/experience/README.md missing section: ## 升格候选")

    task_template = target / "tasks/templates/task-template.md"
    if task_template.exists():
        template_text = task_template.read_text(encoding="utf8")
        for heading in [
            "## 任务摘要",
            "## 执行合同",
            "## 交付结果",
            "### 要做",
            "### 不做",
            "### 约束",
            "### 关键风险",
            "### 测试策略",
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


def extract_heading_block(target: Path, text: str, heading_key: str) -> str | None:
    for heading in heading_aliases(target, heading_key):
        match = re.search(rf"## {re.escape(heading)}\n\n([\s\S]*?)(?=\n## |\Z)", text)
        if match:
            return match.group(1).strip()
    return None


def heading_aliases(target: Path, heading_key: str) -> list[str]:
    aliases = load_heading_aliases(target)
    if heading_key in aliases:
        return aliases[heading_key]
    for values in aliases.values():
        if any(item.strip().lower() == heading_key.strip().lower() for item in values):
            return values
    return [heading_key]


def load_heading_aliases(target: Path) -> dict[str, list[str]]:
    alias_path = target / "bootstrap" / "heading_aliases.json"
    if alias_path.exists():
        return json.loads(alias_path.read_text(encoding="utf8"))
    return {}
