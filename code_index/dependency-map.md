---
title: DEPENDENCY_MAP
doc_role: reference
update_mode: generated
owner_role: Builder
status: active
last_reviewed_at: 2026-03-15
source_of_truth: scripts/ai/generate-module-index.ts
related_docs:
  - code_index/module-index.md
  - docs/ARCHITECTURE.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Dependency Map

- `apps/studio/src/app/*` -> `apps/studio/src/modules/*`
- `scripts/init_project_compounding.py` -> `scripts/compounding_bootstrap/engine.py` -> split modules
- `scripts/ai/*` -> docs / memory / code_index / tasks
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
