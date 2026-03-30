# harness

## 模块目标

负责把单一控制平面 live snapshot 接入 Studio，并输出 orchestration board，供 orchestration service 统一消费。

## 入口与拥有面

- 路由：`/harness`
- 页面：`apps/studio/src/app/harness/page.tsx`
- Service：`apps/studio/src/modules/harness/service.ts`
- 组件：`apps/studio/src/modules/harness/components/harness-board.tsx`
- CLI：`scripts/harness/status.ts`
- 上游统一读模型：`apps/studio/src/modules/orchestration/service.ts`

## 常改文件

- `apps/studio/src/app/harness/page.tsx`
- `apps/studio/src/modules/harness/service.ts`
- `apps/studio/src/modules/harness/types.ts`
- `apps/studio/src/modules/harness/components/harness-board.tsx`
- `apps/studio/src/modules/harness/__tests__/service.test.ts`
- `shared/harness/`
- `scripts/harness/`

## 不变量

- harness 是单一控制平面的只读展示层，不在 Studio 内直接做状态迁移。
- `/harness`、首页、任务页、发布页必须共用同一份 orchestration snapshot，不能再各自拼装多源真相。
- hygiene blocker、workflow state、runtime alignment 和 next action 必须同时出现，不能只展示结论不展示原因。

## 推荐校验

- `pnpm harness:status`
- `pnpm --filter studio test -- src/modules/harness/__tests__/service.test.ts`
- `python3 -m unittest tests.test_harness_cli`

## 常见改动

- 调整 live snapshot 到 UI 字段的映射。
- 调整 orchestration board 的信息层级与可读性。
- 调整 harness CLI 与 Studio 共享读模型的兼容边界。
