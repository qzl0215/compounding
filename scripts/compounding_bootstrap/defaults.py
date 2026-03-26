from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from .catalog import AI_SCRIPT_PATHS, CANONICAL_DOCS, CODE_INDEX_DOCS, MEMORY_DOCS, SCAFFOLD_PATHS, TASK_DOCS, WORKFLOW_FILES

SOURCE_ROOT = Path(__file__).resolve().parents[2]

AGENTS_PATH = "AGENTS.md"
BOOTSTRAP_DIR = "bootstrap"
BRIEF_PATH = "bootstrap/project_brief.yaml"
PROJECT_OPERATOR_PATH = "bootstrap/project_operator.yaml"
LEGACY_CONFIG_PATH = "bootstrap/project_bootstrap.yaml"
LEGACY_BRIEF_SCHEMA_PATH = "bootstrap/schemas/project_brief.schema.json"
RESOLVED_CONFIG_PATH = "output/bootstrap/project_bootstrap.resolved.yaml"
BOOTSTRAP_REPORT_PATH = "output/bootstrap/bootstrap_report.yaml"
OUTPUT_PROPOSALS_DIR = Path("output/proposals")
EXAMPLES_ATTACH_DIR = Path("examples/compounding-attach")

SCHEMAS_DIR = Path("schemas")
TEMPLATES_DIR = Path("templates")
KERNEL_DIR = Path("kernel")

PROJECT_BRIEF_SCHEMA_PATH = SCHEMAS_DIR / "project_brief.schema.yaml"
KERNEL_MANIFEST_SCHEMA_PATH = SCHEMAS_DIR / "kernel_manifest.schema.yaml"
BOOTSTRAP_REPORT_SCHEMA_PATH = SCHEMAS_DIR / "bootstrap_report.schema.yaml"
PROPOSAL_SCHEMA_PATH = SCHEMAS_DIR / "proposal.schema.yaml"
EXPERIENCE_PROMOTION_SCHEMA_PATH = SCHEMAS_DIR / "experience_promotion.schema.yaml"
PROJECT_OPERATOR_SCHEMA_PATH = SCHEMAS_DIR / "project_operator.schema.yaml"

PROJECT_BRIEF_TEMPLATE_PATH = TEMPLATES_DIR / "project_brief.template.yaml"
BOOTSTRAP_REPORT_TEMPLATE_PATH = TEMPLATES_DIR / "bootstrap_report.template.yaml"
PROPOSAL_TEMPLATE_PATH = TEMPLATES_DIR / "proposal.template.yaml"
EXPERIENCE_PROMOTION_TEMPLATE_PATH = TEMPLATES_DIR / "experience_promotion.template.yaml"
PROJECT_OPERATOR_TEMPLATE_PATH = TEMPLATES_DIR / "project_operator.template.yaml"

KERNEL_MANIFEST_PATH = KERNEL_DIR / "kernel_manifest.yaml"
KERNEL_VERSION = "0.1.0"

BASELINE_COMMIT_MESSAGE = "chore: baseline bootstrap initialization"
CANONICAL_BLOCK_ID = "CANONICAL_CONTENT"
DIFF_CATEGORIES = ("auto_apply", "proposal_required", "suggest_only", "blocked")

REQUIRED_FRONTMATTER = [
    "title",
    "update_mode",
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

DEFAULT_OWNED_PATHS = [
    "memory/project/**",
    "tasks/queue/**",
    "apps/**",
]

DEFAULT_PROTECTED_RULES = [
    "禁止自动修改核心业务代码",
    "禁止自动修改部署主入口",
    "禁止自动修改生产脚本",
]

DEFAULT_AUTO_APPLY_PATHS = [
    "bootstrap/project_brief.yaml",
    "bootstrap/project_operator.yaml",
    "tasks/templates/task-template.md",
]

DEFAULT_PROPOSAL_REQUIRED_PATHS = [
    "AGENTS.md",
    "docs/WORK_MODES.md",
    "docs/DEV_WORKFLOW.md",
    "docs/ARCHITECTURE.md",
    "docs/PROJECT_RULES.md",
    "docs/AI_OPERATING_MODEL.md",
    "docs/ASSET_MAINTENANCE.md",
    "scripts/compounding_bootstrap/*",
]

DEFAULT_BLOCKED_PATHS = [
    "apps/**",
    "scripts/release/**",
    "scripts/local-runtime/**",
    "deploy/**",
]

MINIMAL_PROTOCOL_DOCS = [
    "docs/WORK_MODES.md",
    "docs/DEV_WORKFLOW.md",
    "docs/ARCHITECTURE.md",
    "docs/PROJECT_RULES.md",
    "docs/AI_OPERATING_MODEL.md",
    "docs/ASSET_MAINTENANCE.md",
]

MINIMAL_MEMORY_DOCS = [
    "memory/project/roadmap.md",
    "memory/project/current-state.md",
    "memory/project/operating-blueprint.md",
    "memory/project/tech-debt.md",
]


@dataclass
class AuditResult:
    passed: bool
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    checked_files: list[str] = field(default_factory=list)
    missing_assets: list[str] = field(default_factory=list)
    conflicting_rules: list[str] = field(default_factory=list)
    hardcoded_legacy_terms: list[str] = field(default_factory=list)


__all__ = [
    "AGENTS_PATH",
    "AI_SCRIPT_PATHS",
    "BASELINE_COMMIT_MESSAGE",
    "BOOTSTRAP_DIR",
    "BOOTSTRAP_REPORT_PATH",
    "BOOTSTRAP_REPORT_SCHEMA_PATH",
    "BOOTSTRAP_REPORT_TEMPLATE_PATH",
    "BRIEF_PATH",
    "CANONICAL_BLOCK_ID",
    "CANONICAL_DOCS",
    "CODE_INDEX_DOCS",
    "DEFAULT_AUTO_APPLY_PATHS",
    "DEFAULT_BLOCKED_PATHS",
    "DEFAULT_OWNED_PATHS",
    "DEFAULT_PROPOSAL_REQUIRED_PATHS",
    "DEFAULT_PROTECTED_RULES",
    "DIFF_CATEGORIES",
    "EXAMPLES_ATTACH_DIR",
    "EXPERIENCE_PROMOTION_SCHEMA_PATH",
    "EXPERIENCE_PROMOTION_TEMPLATE_PATH",
    "PROJECT_OPERATOR_PATH",
    "PROJECT_OPERATOR_SCHEMA_PATH",
    "PROJECT_OPERATOR_TEMPLATE_PATH",
    "HARD_FILE_LIMIT",
    "KERNEL_DIR",
    "KERNEL_MANIFEST_PATH",
    "KERNEL_MANIFEST_SCHEMA_PATH",
    "KERNEL_VERSION",
    "LEGACY_BRIEF_SCHEMA_PATH",
    "LEGACY_CONFIG_PATH",
    "LEGACY_TERMS",
    "MANAGED_FRONTMATTER_FIELDS",
    "MEMORY_DOCS",
    "MINIMAL_MEMORY_DOCS",
    "MINIMAL_PROTOCOL_DOCS",
    "OUTPUT_PROPOSALS_DIR",
    "PROJECT_BRIEF_SCHEMA_PATH",
    "PROJECT_BRIEF_TEMPLATE_PATH",
    "PROPOSAL_SCHEMA_PATH",
    "PROPOSAL_TEMPLATE_PATH",
    "REQUIRED_FRONTMATTER",
    "RESOLVED_CONFIG_PATH",
    "SCAFFOLD_PATHS",
    "SCHEMAS_DIR",
    "SOFT_FILE_LIMIT",
    "SOURCE_ROOT",
    "TASK_DOCS",
    "TEMPLATES_DIR",
    "WORKFLOW_FILES",
    "AuditResult",
]
