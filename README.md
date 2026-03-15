# Compounding AI Operating System

这是一个面向 AI 长期协作的 AI-Native Repo。默认先读 `AGENTS.md`，再按需进入 `docs/*`、`memory/*`、`code_index/*` 和 `tasks/*`。

## Quick Start

1. 先读 `AGENTS.md`
2. 运行 `python3 scripts/pre_mutation_check.py`
3. 打开当前任务：`tasks/queue/task-001-repo-refactor.md`
4. 需要更深上下文时，读 `docs/PROJECT_RULES.md`、`docs/ARCHITECTURE.md`、`docs/DEV_WORKFLOW.md`、`docs/AI_OPERATING_MODEL.md`

## Repo Shape

- `apps/studio/`: 只读文档门户
- `scripts/compounding_bootstrap/`: bootstrap / scaffold / audit / proposal 引擎
- `docs/`: 规则、架构、工作流、AI operating model、重构计划
- `memory/`: 架构记忆、项目状态、经验、ADR
- `code_index/`: 模块索引、依赖图、函数索引
- `tasks/`: 任务模板、任务队列、归档
