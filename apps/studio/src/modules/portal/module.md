# portal

## 模块目标

负责人类优先的首页逻辑态势图、默认阅读入口和证据入口分组。

## 入口与拥有面

- 路由：`/`
- 页面：`apps/studio/src/app/page.tsx`
- Service：`apps/studio/src/modules/portal/service.ts`
- 组件：`apps/studio/src/modules/portal/components/home-logic-board.tsx`
- Builder：`apps/studio/src/modules/portal/builders/home-logic-map.ts`

## 常改文件

- `apps/studio/src/app/page.tsx`
- `apps/studio/src/modules/portal/service.ts`
- `apps/studio/src/modules/portal/types.ts`
- `apps/studio/src/modules/portal/builders/home-logic-map.ts`
- `apps/studio/src/modules/portal/components/home-logic-board.tsx`
- `apps/studio/src/modules/portal/__tests__/service.test.ts`
- `apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx`

## 不变量

- 首页只展示项目逻辑态势与下钻入口，不回流 Kernel、artifact、workspace path 等工程对象。
- 首页节点必须可点击，并只指向一个最相关的文档或页面。
- 首页的阶段、焦点、待验收和运行提醒必须与任务页、发布页共享同一份项目状态摘要。

## 推荐校验

- `pnpm --filter studio test -- apps/studio/src/modules/portal/__tests__/service.test.ts apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx`
- `pnpm --filter studio build`

## 常见改动

- 调整首页头部判断句、阶段映射或逻辑图节点摘要。
- 增删首页逻辑节点或修改节点跳转目标。
- 调整知识库精选入口分组或首页视觉层级。
