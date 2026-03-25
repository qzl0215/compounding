# releases

## 模块目标

负责本机/内网发布管理页、release registry 读取、本地生产运行态展示、发布/回滚动作调度，以及发布目录约定的统一入口。

## 入口与拥有面

- 路由：`/releases`
- 页面：`apps/studio/src/app/releases/page.tsx`
- Service：`apps/studio/src/modules/releases/registry.ts`
- 动作：`apps/studio/src/modules/releases/actions-service.ts`
- CLI：`scripts/release/*`

## 常改文件

- `apps/studio/src/app/releases/page.tsx`
- `apps/studio/src/modules/releases/registry.ts`
- `apps/studio/src/modules/releases/actions-service.ts`
- `apps/studio/src/modules/releases/runtime.ts`
- `apps/studio/src/modules/releases/components/release-dashboard-panel.tsx`
- `apps/studio/src/modules/releases/__tests__/service.test.ts`
- `tests/test_release_registry_state.py`

## 不变量

- release 只承接验收与运行事实，不回写 task 正文，也不生成第二份计划状态。
- `main` 是唯一生产主线；preview 和 rollback 只通过 release 切换完成。
- 页面展示优先读取规范化后的 release snapshot，不直接消费旧 `delivery_*` 兼容字段。

## 推荐校验

- `pnpm --filter studio test -- apps/studio/src/modules/releases/__tests__/service.test.ts`
- `python3 -m unittest tests.test_release_registry_state`
- `pnpm prod:check`

## 常见改动

- 调整 release dashboard 读取、待验收判断或本地运行态解释。
- 调整发布/回滚动作的入口、返回值或页面提示。
- 调整 release registry 的兼容适配与摘要读取。
