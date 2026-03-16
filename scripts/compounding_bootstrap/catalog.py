from __future__ import annotations

AGENTS_SOURCE = "AGENTS.md"

CANONICAL_DOCS = [
    "docs/PROJECT_RULES.md",
    "docs/ARCHITECTURE.md",
    "docs/ORG_MODEL.md",
    "docs/WORK_MODES.md",
    "docs/DEV_WORKFLOW.md",
    "docs/AI_OPERATING_MODEL.md",
    "docs/REFACTOR_PLAN.md",
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

DOC_META = {
    AGENTS_SOURCE: {
        "title": "AGENTS",
        "doc_role": "source",
        "update_mode": "manual",
        "owner_role": "Foreman",
        "source_of_truth": AGENTS_SOURCE,
        "related_docs": [
            "docs/PROJECT_RULES.md",
            "docs/ARCHITECTURE.md",
            "docs/WORK_MODES.md",
            "docs/DEV_WORKFLOW.md",
            "docs/AI_OPERATING_MODEL.md",
            "memory/project/current-state.md",
            "memory/project/roadmap.md",
        ],
    },
    "docs/PROJECT_RULES.md": {
        "title": "PROJECT_RULES",
        "doc_role": "reference",
        "update_mode": "promote_only",
        "owner_role": "Architect",
        "source_of_truth": AGENTS_SOURCE,
        "related_docs": [AGENTS_SOURCE, "docs/ARCHITECTURE.md", "memory/project/tech-debt.md"],
    },
    "docs/ARCHITECTURE.md": {
        "title": "ARCHITECTURE",
        "doc_role": "reference",
        "update_mode": "promote_only",
        "owner_role": "Architect",
        "source_of_truth": AGENTS_SOURCE,
        "related_docs": [AGENTS_SOURCE, "code_index/module-index.md", "memory/architecture/system-overview.md"],
    },
    "docs/ORG_MODEL.md": {
        "title": "ORG_MODEL",
        "doc_role": "reference",
        "update_mode": "promote_only",
        "owner_role": "Foreman",
        "source_of_truth": AGENTS_SOURCE,
        "related_docs": [AGENTS_SOURCE, "docs/WORK_MODES.md", "docs/ARCHITECTURE.md", "memory/project/roadmap.md"],
    },
    "docs/WORK_MODES.md": {
        "title": "WORK_MODES",
        "doc_role": "reference",
        "update_mode": "manual",
        "owner_role": "Foreman",
        "source_of_truth": AGENTS_SOURCE,
        "related_docs": [AGENTS_SOURCE, "docs/ORG_MODEL.md", "docs/AI_OPERATING_MODEL.md", "memory/project/roadmap.md"],
    },
    "docs/DEV_WORKFLOW.md": {
        "title": "DEV_WORKFLOW",
        "doc_role": "operation",
        "update_mode": "manual",
        "owner_role": "Builder",
        "source_of_truth": AGENTS_SOURCE,
        "related_docs": [AGENTS_SOURCE, "docs/WORK_MODES.md", "docs/AI_OPERATING_MODEL.md", "tasks/templates/task-template.md"],
    },
    "docs/AI_OPERATING_MODEL.md": {
        "title": "AI_OPERATING_MODEL",
        "doc_role": "reference",
        "update_mode": "manual",
        "owner_role": "Foreman",
        "source_of_truth": AGENTS_SOURCE,
        "related_docs": [AGENTS_SOURCE, "docs/WORK_MODES.md", "docs/DEV_WORKFLOW.md", "memory/experience/README.md", "code_index/module-index.md"],
    },
    "docs/REFACTOR_PLAN.md": {
        "title": "REFACTOR_PLAN",
        "doc_role": "planning",
        "update_mode": "manual",
        "owner_role": "Foreman",
        "source_of_truth": "tasks/queue/task-001-repo-refactor.md",
        "related_docs": ["memory/project/current-state.md", "memory/project/tech-debt.md", "memory/project/roadmap.md"],
    },
    "memory/architecture/system-overview.md": {
        "title": "SYSTEM_OVERVIEW",
        "doc_role": "memory",
        "update_mode": "promote_only",
        "owner_role": "Architect",
        "source_of_truth": "docs/ARCHITECTURE.md",
        "related_docs": ["docs/ARCHITECTURE.md", "code_index/dependency-map.md"],
    },
    "memory/project/current-state.md": {
        "title": "CURRENT_STATE",
        "doc_role": "memory",
        "update_mode": "manual",
        "owner_role": "Foreman",
        "source_of_truth": "memory/project/roadmap.md",
        "related_docs": [AGENTS_SOURCE, "memory/project/roadmap.md", "memory/project/operating-blueprint.md", "tasks/queue/task-001-repo-refactor.md"],
    },
    "memory/project/operating-blueprint.md": {
        "title": "OPERATING_BLUEPRINT",
        "doc_role": "planning",
        "update_mode": "manual",
        "owner_role": "PMO",
        "source_of_truth": "memory/project/roadmap.md",
        "related_docs": [AGENTS_SOURCE, "memory/project/roadmap.md", "memory/project/current-state.md", "tasks/queue/task-001-repo-refactor.md"],
    },
    "memory/project/tech-debt.md": {
        "title": "TECH_DEBT",
        "doc_role": "memory",
        "update_mode": "append_only",
        "owner_role": "Auditor",
        "source_of_truth": "docs/REFACTOR_PLAN.md",
        "related_docs": ["docs/PROJECT_RULES.md", "docs/REFACTOR_PLAN.md"],
    },
    "memory/project/roadmap.md": {
        "title": "ROADMAP",
        "doc_role": "planning",
        "update_mode": "manual",
        "owner_role": "Foreman",
        "source_of_truth": "tasks/queue/task-001-repo-refactor.md",
        "related_docs": [AGENTS_SOURCE, "memory/project/current-state.md", "memory/project/operating-blueprint.md", "tasks/queue/task-001-repo-refactor.md"],
    },
    "memory/experience/README.md": {
        "title": "EXPERIENCE_README",
        "doc_role": "memory",
        "update_mode": "append_only",
        "owner_role": "Auditor",
        "source_of_truth": AGENTS_SOURCE,
        "related_docs": ["memory/decisions/ADR-001-ai-native-repo-skeleton.md"],
    },
    "memory/experience/exp-001-thin-agents-entry.md": {
        "title": "EXP_001_THIN_AGENTS_ENTRY",
        "doc_role": "memory",
        "update_mode": "append_only",
        "owner_role": "Foreman",
        "source_of_truth": "memory/experience/README.md",
        "related_docs": [AGENTS_SOURCE, "docs/AI_OPERATING_MODEL.md"],
    },
    "memory/experience/exp-002-memory-before-promotion.md": {
        "title": "EXP_002_MEMORY_BEFORE_PROMOTION",
        "doc_role": "memory",
        "update_mode": "append_only",
        "owner_role": "Auditor",
        "source_of_truth": "memory/experience/README.md",
        "related_docs": ["memory/project/tech-debt.md", "docs/PROJECT_RULES.md"],
    },
    "memory/experience/exp-003-delete-legacy-ui-first.md": {
        "title": "EXP_003_DELETE_LEGACY_UI_FIRST",
        "doc_role": "memory",
        "update_mode": "append_only",
        "owner_role": "Builder",
        "source_of_truth": "memory/experience/README.md",
        "related_docs": ["docs/REFACTOR_PLAN.md", "memory/project/tech-debt.md"],
    },
    "memory/decisions/ADR-001-ai-native-repo-skeleton.md": {
        "title": "ADR_001_AI_NATIVE_REPO_SKELETON",
        "doc_role": "memory",
        "update_mode": "append_only",
        "owner_role": "Foreman",
        "source_of_truth": "docs/ARCHITECTURE.md",
        "related_docs": ["docs/REFACTOR_PLAN.md", "memory/project/roadmap.md"],
    },
    "memory/decisions/ADR-002-thin-agents-entry-contract.md": {
        "title": "ADR_002_THIN_AGENTS_ENTRY_CONTRACT",
        "doc_role": "memory",
        "update_mode": "append_only",
        "owner_role": "Foreman",
        "source_of_truth": AGENTS_SOURCE,
        "related_docs": [AGENTS_SOURCE, "docs/AI_OPERATING_MODEL.md"],
    },
    "memory/decisions/ADR-003-no-new-giant-utils.md": {
        "title": "ADR_003_NO_NEW_GIANT_UTILS",
        "doc_role": "memory",
        "update_mode": "append_only",
        "owner_role": "Architect",
        "source_of_truth": "docs/PROJECT_RULES.md",
        "related_docs": ["docs/PROJECT_RULES.md", "memory/project/tech-debt.md"],
    },
    "code_index/module-index.md": {
        "title": "MODULE_INDEX",
        "doc_role": "reference",
        "update_mode": "generated",
        "owner_role": "Builder",
        "source_of_truth": "scripts/ai/generate-module-index.ts",
        "related_docs": ["docs/ARCHITECTURE.md", "code_index/dependency-map.md", "code_index/function-index.json"],
    },
    "code_index/dependency-map.md": {
        "title": "DEPENDENCY_MAP",
        "doc_role": "reference",
        "update_mode": "generated",
        "owner_role": "Builder",
        "source_of_truth": "scripts/ai/generate-module-index.ts",
        "related_docs": ["code_index/module-index.md", "docs/ARCHITECTURE.md"],
    },
}
