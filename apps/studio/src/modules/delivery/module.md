# delivery

## 模块目标

负责把任务板、release 面板和当前 diff 汇总成一份可交付快照，供首页与交付页统一读取。

## 入口与拥有面

- 路由：`/tasks`
- 路由：`/releases`
- Service：`apps/studio/src/modules/delivery/service.ts`
- Diff：`apps/studio/src/modules/delivery/diff-aware.ts`
- 组件：`apps/studio/src/modules/delivery/components/diff-aware-panel.tsx`

## 常改文件

- `apps/studio/src/modules/delivery/service.ts`
- `apps/studio/src/modules/delivery/types.ts`
- `apps/studio/src/modules/delivery/diff-aware.ts`
- `apps/studio/src/modules/delivery/diff-aware-summaries.ts`
- `apps/studio/src/modules/delivery/components/diff-aware-panel.tsx`
- `apps/studio/src/modules/delivery/__tests__/diff-aware.test.ts`
- `apps/studio/src/modules/delivery/__tests__/service.test.ts`

## 不变量

- diff-aware 摘要只提供验证与风险线索，不升级为新的治理主源。
- 交付快照必须复用 task 和 release 真相源，不本地发明第三套状态。
- 选测输出默认快、必要时重，不把 full validation 变成每次 feature 改动的默认负担。

## 推荐校验

- `pnpm --filter studio test -- apps/studio/src/modules/delivery/__tests__/diff-aware.test.ts apps/studio/src/modules/delivery/__tests__/service.test.ts`
- `pnpm --filter studio build`

## 常见改动

- 调整 diff-aware 的范围归类、健康分或检查建议。
- 调整任务交付投影与 release 页面消费的共享快照。
- 调整选测分层、退休建议和 review / retro 摘要。
