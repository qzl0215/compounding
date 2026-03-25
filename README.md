# 仓库说明

这是一个面向 AI 长期协作的 AI-Native Repo。默认先读 `AGENTS.md`，再按主干进入 `memory/project/*` 与 `docs/*`，最后按需补 `tasks/*`、`code_index/*` 和专项附录。

## 快速开始

1. 先读 `AGENTS.md`
2. 读 `memory/project/roadmap.md`
3. 读 `memory/project/current-state.md`
4. 读 `memory/project/operating-blueprint.md`
5. 需要判断当前场景时，读 `docs/WORK_MODES.md`
6. 需要执行顺序与门禁时，读 `docs/DEV_WORKFLOW.md`
7. 需要模块与运行时边界时，读 `docs/ARCHITECTURE.md`
8. 已进入 task 时，打开 `tasks/queue/*.md`
9. 需要代码导航时，再读 `code_index/*`
10. 准备动手前，先运行 `pnpm preflight`；若是 `structural / release` task，则运行 `pnpm preflight -- --taskId=t-xxx`

## 仓库结构

- `apps/studio/`: 只读文档门户，首页是面向人的项目逻辑态势图
- `scripts/compounding_bootstrap/`: bootstrap / scaffold / audit / proposal 引擎
- `docs/`: 4 文档主干与专项附录
- `memory/`: 架构记忆、项目状态、经验、ADR
- `code_index/`: 模块索引、依赖图、函数索引
- `tasks/`: 任务模板与任务队列
