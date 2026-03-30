# orchestration

## 模块目标

负责把 harness、delivery、project-state 与首页逻辑图聚合成唯一的 Studio 读模型，供 Home、Tasks、Releases 与 `/harness` 共享读取。

## 入口与拥有面

- Service：`apps/studio/src/modules/orchestration/service.ts`
- 类型：`apps/studio/src/modules/orchestration/types.ts`
- 页面：`apps/studio/src/app/page.tsx`
- 页面：`apps/studio/src/app/tasks/page.tsx`
- 页面：`apps/studio/src/app/releases/page.tsx`
- 页面：`apps/studio/src/app/harness/page.tsx`

## 常改文件

- `apps/studio/src/modules/orchestration/service.ts`
- `apps/studio/src/modules/orchestration/types.ts`
- `apps/studio/src/modules/orchestration/__tests__/service.test.ts`
- `apps/studio/src/app/page.tsx`
- `apps/studio/src/app/tasks/page.tsx`
- `apps/studio/src/app/releases/page.tsx`
- `apps/studio/src/app/harness/page.tsx`

## 不变量

- orchestration 只做聚合，不新增第四套真相源。
- 所有 Studio 主要页面必须共读同一份 orchestration snapshot。
- orchestration 的返回值里，harness、delivery、project-state 和 home 仍然保留各自领域边界，不互相改写。

## 推荐校验

- `pnpm --filter studio test -- apps/studio/src/modules/orchestration/__tests__/service.test.ts`
- `pnpm --filter studio build`

## 常见改动

- 调整 orchestration snapshot 的聚合字段。
- 调整页面对同一份 snapshot 的投影方式。
- 调整首页、任务页、发布页与 harness 页面之间共享的读链。
