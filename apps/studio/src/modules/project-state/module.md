# project-state

## 模块目标

负责把项目当前阶段、当前焦点、计划积压、任务执行态和 release 运行态汇总成项目状态快照，供 orchestration service 统一消费，再由首页、任务页和发布页共享读取。

## 入口与拥有面

- 路由：`/`
- 路由：`/tasks`
- 路由：`/releases`
- Service：`apps/studio/src/modules/project-state/service.ts`
- 类型：`apps/studio/src/modules/project-state/types.ts`
- 文档：`memory/project/current-state.md`、`memory/project/roadmap.md`、`memory/project/operating-blueprint.md`
- 上游统一读模型：`apps/studio/src/modules/orchestration/service.ts`

## 常改文件

- `apps/studio/src/modules/project-state/service.ts`
- `apps/studio/src/modules/project-state/types.ts`
- `apps/studio/src/modules/project-state/index.ts`
- `apps/studio/src/modules/portal/service.ts`
- `apps/studio/src/app/tasks/page.tsx`
- `apps/studio/src/app/releases/page.tsx`

## 不变量

- project-state 只聚合已有真相源，不新建第四套项目状态主源。
- 首页/任务页/发布页消费的项目状态结论必须通过 orchestration snapshot 共用同一份快照，不能各自发明摘要。
- release 与 runtime 提醒只负责提示当前动作，不替代 release、task 或 memory 文档本身。

## 推荐校验

- `pnpm --filter studio build`
- `pnpm ai:scan-health`

## 常见改动

- 调整首页、任务页、发布页共享的项目阶段和焦点摘要逻辑。
- 调整 memory/project 文档到状态快照的字段映射。
- 调整 release 运行态、待验收版本和下一步建议的归纳口径。
