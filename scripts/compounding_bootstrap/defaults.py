from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from .catalog import AI_SCRIPT_PATHS, CANONICAL_DOCS, CODE_INDEX_DOCS, DOC_META, MEMORY_DOCS, SCAFFOLD_PATHS, TASK_DOCS, WORKFLOW_FILES

AGENTS_PATH = "AGENTS.md"
BRIEF_PATH = "bootstrap/project_brief.yaml"
LEGACY_CONFIG_PATH = "bootstrap/project_bootstrap.yaml"
BRIEF_SCHEMA_PATH = "bootstrap/schemas/project_brief.schema.json"
RESOLVED_CONFIG_PATH = "output/bootstrap/project_bootstrap.resolved.yaml"
BASELINE_COMMIT_MESSAGE = "chore: baseline bootstrap initialization"
CANONICAL_BLOCK_ID = "CANONICAL_CONTENT"
OUTPUT_PROPOSALS_DIR = Path("output/proposals")

REQUIRED_FRONTMATTER = [
    "title",
    "doc_role",
    "update_mode",
    "owner_role",
    "status",
    "last_reviewed_at",
    "source_of_truth",
    "related_docs",
]

MANAGED_FRONTMATTER_FIELDS = REQUIRED_FRONTMATTER.copy()

LEGACY_TERMS = [
    "ranking_app_parallel",
    "PG/Qdrant",
    "ranking-app-parallel",
    "legacy_project_name",
    "PROJECT_CARD",
    "COMPOUNDING_SYSTEM",
    "docs/00_SYSTEM/COMPOUNDING_SYSTEM.md",
    "docs/reference/",
    "docs/operations/",
    "docs/planning/",
    "docs/memory/",
]

SOFT_FILE_LIMIT = 250
HARD_FILE_LIMIT = 400


@dataclass
class AuditResult:
    passed: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    checked_files: list[str] = field(default_factory=list)
    missing_assets: list[str] = field(default_factory=list)
    conflicting_rules: list[str] = field(default_factory=list)
    hardcoded_legacy_terms: list[str] = field(default_factory=list)
