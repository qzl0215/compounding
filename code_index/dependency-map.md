---
title: DEPENDENCY_MAP
doc_role: reference
update_mode: generated
owner_role: Builder
status: active
last_reviewed_at: 2026-03-16
source_of_truth: scripts/ai/generate-module-index.ts
related_docs:
  - code_index/module-index.md
  - docs/ARCHITECTURE.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 依赖图

## 允许的依赖方向

- `AGENTS.md` -> `docs/*` -> `tasks/*` -> `code_index/*` -> code
- `apps/studio/src/app/*` -> `apps/studio/src/modules/*` -> `components/ui/*` / `lib/workspace.ts`
- `scripts/init_project_compounding.py` -> `scripts/compounding_bootstrap/engine.py` -> split modules
- `scripts/ai/*` -> filesystem / JSON / markdown outputs

## 禁止的依赖方向

- app 层直接读取任意仓库文件而绕过模块仓储层
- 模块之间跨层访问私有实现
- 任务、记忆、索引互相覆盖职责
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
