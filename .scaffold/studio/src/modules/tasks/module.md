# tasks

## 模块目标

负责把 `tasks/queue/*` 解析成执行合同视图，并与 companion / release 机器事实拼成任务面板数据。

## 入口与拥有面

- 路由：`/tasks`
- 页面：`apps/studio/src/app/tasks/page.tsx`
- Service：`apps/studio/src/modules/tasks/service.ts`
- 组件：`apps/studio/src/modules/tasks/components/delivery-table.tsx`
- 文档：`tasks/queue/*.md`

## 常改文件

- `apps/studio/src/app/tasks/page.tsx`
- `apps/studio/src/modules/tasks/service.ts`
- `apps/studio/src/modules/tasks/parsing.ts`
- `apps/studio/src/modules/tasks/delivery.ts`
- `apps/studio/src/modules/tasks/subtask-table.ts`
- `apps/studio/src/modules/tasks/components/delivery-table.tsx`
- `apps/studio/src/modules/tasks/__tests__/service.test.ts`

## 不变量

- task 只表示执行合同，不承接待规划对象。
- 合同字段与机器事实必须分层读取，不能把 provenance 再塞回任务摘要层。
- `/tasks` 只展示可执行事项，不平铺已发布历史和规划态对象。

## 推荐校验

- `pnpm --filter studio test -- apps/studio/src/modules/tasks/__tests__/service.test.ts`
- `node --experimental-strip-types scripts/ai/validate-task-git-link.ts`

## 常见改动

- 调整 task 合同字段解析或任务表列映射。
- 调整 companion / release 机器事实在任务展开态的呈现。
- 调整 `/tasks` 主表只展示执行事项的过滤逻辑。
