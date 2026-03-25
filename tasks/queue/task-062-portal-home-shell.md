# 任务 task-062-portal-home-shell

## 任务摘要

- 短编号：`t-062`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  收薄 portal 首页 shell
- 为什么现在：
  `apps/studio/src/modules/portal/components/home-dashboard.tsx` 仍然是当前最大 portal 热点之一；在 builders 聚合层已拆薄后，下一步最值钱的是把首页 shell 自身再切成更小的面板模块，避免页面入口继续堆叠展示逻辑。
- 承接边界：
  只拆 `home-dashboard.tsx` 这一层：首页 tab shell 继续保留，Project / Kernel 面板和其局部展示 helper 下沉到更小的内部模块；保持 `service.ts`、`builders.ts`、`index.ts` 和现有首页语义不变；不碰 release、task 状态或 `types.ts` taxonomy 重构。
- 完成定义：
  `home-dashboard.tsx` 退化为薄 shell；Project / Kernel 面板逻辑不再堆在同一文件里；`cleanup-candidates` 不再把 `home-dashboard.tsx` 视为单文件热点；首页默认 `Project` Tab 和所有现有渲染行为保持不变。

## 执行合同

### 要做

- `apps/studio/src/modules/portal/components/home-dashboard.tsx` 的 shell / panel 拆分
- Project / Kernel 面板与其局部 helper 下沉到更小模块
- 相关最小回归测试与主源状态同步

### 不做

- `types.ts` 全量 taxonomy 重构
- release 兼容壳或 task 交付链改造
- 首页功能、路由或交互行为变更

### 约束

- 保持首页默认 Project Tab 与 Kernel/Project 语义不变
- 保持现有 `portal` 对外接口兼容
- 不引入新的页面状态源或长期配置文件

### 关键风险

如果只搬代码不切边界，`home-dashboard.tsx` 还会继续成为高噪音入口；如果抽出的面板组件过度共享 helper，又会把复杂度重新集中到另一个大文件里。

### 测试策略

- 为什么测：这轮改的是首页展示壳，最容易回退的是 tab 默认值、面板渲染和布局入口。
- 测什么：`home-dashboard` 渲染、portal service snapshot、cleanup candidate 热点变化。
- 不测什么：不改 release 链路，不新增浏览器端端到端测试。
- 当前最小集理由：现有 portal 单测已经覆盖首页 shell 和 snapshot，补一次结构拆分验证就够锁住行为。

## 交付结果

- 状态：doing
- 体验验收结果：

- 交付结果：

- 复盘：

## 当前模式

工程执行

## 分支

`codex/task-062-portal-home-shell`

## 关联模块

- `apps/studio/src/modules/portal/components/home-dashboard.tsx`
- `apps/studio/src/modules/portal/components/home-fragments.tsx`
- `apps/studio/src/modules/portal/builders.ts`
- `apps/studio/src/modules/portal/service.ts`
- `apps/studio/src/modules/portal/index.ts`
- `apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx`
- `apps/studio/src/modules/portal/__tests__/service.test.ts`
- `memory/project/roadmap.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`

## 更新痕迹

- 记忆：updated current-state / roadmap / operating-blueprint to focus on t-062 portal home shell thinning
- 索引：no change
- 路线图：set roadmap current priority to t-062 portal home shell thinning
- 文档：tasks/queue/task-062-portal-home-shell.md
