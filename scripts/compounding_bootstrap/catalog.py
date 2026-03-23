from __future__ import annotations

AGENTS_SOURCE = "AGENTS.md"

CANONICAL_DOCS = [
    "docs/PROJECT_RULES.md",
    "docs/ARCHITECTURE.md",
    "docs/WORK_MODES.md",
    "docs/DEV_WORKFLOW.md",
    "docs/AI_OPERATING_MODEL.md",
    "docs/ASSET_MAINTENANCE.md",
]

PROMPT_DOCS = [
    "docs/prompts/ai-doc-rewrite-system.md",
    "docs/prompts/ai-doc-clarify-user.md",
    "docs/prompts/ai-doc-rewrite-user.md",
]

MEMORY_DOCS = [
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

CODE_INDEX_DOCS = [
    "code_index/module-index.md",
    "code_index/dependency-map.md",
    "code_index/function-index.json",
]

TASK_DOCS = [
    "tasks/templates/task-template.md",
    "tasks/queue/task-001-repo-refactor.md",
    "tasks/archive/.gitkeep",
]

AI_SCRIPT_PATHS = [
    "scripts/ai/lib/task-template.js",
    "scripts/ai/scan-code-health.ts",
    "scripts/ai/generate-module-index.ts",
    "scripts/ai/build-context.ts",
    "scripts/ai/create-task.ts",
    "scripts/ai/validate-change-trace.ts",
    "scripts/ai/validate-task-git-link.ts",
]

WORKFLOW_FILES = [
    ".github/pull_request_template.md",
]

SCAFFOLD_PATHS = [
    AGENTS_SOURCE,
    "README.md",
    *CANONICAL_DOCS,
    *PROMPT_DOCS,
    *MEMORY_DOCS,
    *CODE_INDEX_DOCS,
    *TASK_DOCS,
    *AI_SCRIPT_PATHS,
    *WORKFLOW_FILES,
]
