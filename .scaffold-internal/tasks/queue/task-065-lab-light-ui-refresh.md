# 任务 task-065-lab-light-ui-refresh

## 任务摘要

- 短编号：`t-065`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把 Studio 整体切到浅色实验室风格
- 为什么现在：
  当前 UI 虽然已经收口成控制台/态势图结构，但整体仍偏深色，实验室感和阅读舒适度不够；现在要把首页、任务、证据和发布页统一成浅色、克制、带少量冷色强调的实验室风格。
- 承接边界：
  只改 Studio 前端外观与共享 UI 底座；保持信息架构、路由、数据模型、任务语义和发布流程不变。
- 完成定义：
  首页、任务页、知识库页、发布页和文档编辑相关 surface 统一为浅色实验室风格；首屏、表格、卡片、导航、按钮和文档阅读区的视觉语气一致；桌面与移动端都保持可读、可用、不过度装饰。

## 执行合同

### 要做

- 全局浅色主题与背景
- 共享卡片、徽标、页头和导航风格统一
- 首页、任务、知识库、发布页首屏调整
- 表格、表单、文档阅读与编辑 surface 的浅色化
- 相关截图验证与回归检查

### 不做

- 不改后端数据结构
- 不改路由语义
- 不新增信息面板或第二套 UI 体系
- 不重写任务、发布或文档业务逻辑

### 约束

- 只使用一套浅色实验室调性，不在页面之间切换成多个风格
- 保持足够的文字与背景对比度
- 共享组件优先，避免每个页面单独长出一套样式
- 不引入大型新 UI 库

### 关键风险

如果只改底色不改层级，浅色主题会显得发白且松散；如果把对比度压得过低，任务表和文档正文会失去可读性。

### 测试策略

- 为什么测：这是一轮跨页面视觉收口，最容易在共享底座、文档页和表格页上产生回归。
- 测什么：浅色主题下的首页、任务页、知识库页、发布页截图；lint、build、test；关键交互是否仍可用。
- 不测什么：不新增端到端发布链路测试。
- 当前最小集理由：共享组件和首屏已是主要受影响面，先锁住这些 surface 的视觉一致性即可。

## 交付结果

- 状态：completed
- 体验验收结果：
  Studio 首页、任务页、知识库页、发布页和文档编辑 surface 已统一为浅色实验室风格，视觉层级、控件语气和阅读舒适度保持一致。
- 交付结果：
  完成共享底座、页头、卡片、徽标、侧边栏、表格和文档编辑器的浅色化收口，保留现有信息架构与路由语义不变。
- 复盘：
  先改共享 surface 再改页面残留的顺序是对的；最后一轮通过真实截图确认了首页、任务、证据和发布页的浅色一致性。

## 当前模式

工程执行

## 分支

`main`

## 关联模块

- `apps/studio/src/app/globals.css`
- `apps/studio/src/components/shell/app-shell.tsx`
- `apps/studio/src/components/ui/card.tsx`
- `apps/studio/src/components/ui/badge.tsx`
- `apps/studio/src/components/ui/page-header.tsx`
- `apps/studio/tailwind.config.ts`
- `apps/studio/src/app/page.tsx`
- `apps/studio/src/app/tasks/page.tsx`
- `apps/studio/src/app/knowledge-base/page.tsx`
- `apps/studio/src/app/releases/page.tsx`
- `apps/studio/src/modules/portal/components/home-logic-board.tsx`
- `apps/studio/src/modules/tasks/components/delivery-table.tsx`
- `apps/studio/src/modules/tasks/components/delivery-table-controls.tsx`
- `apps/studio/src/modules/tasks/components/delivery-table-row.tsx`
- `apps/studio/src/modules/releases/components/release-dashboard-controls.tsx`
- `apps/studio/src/modules/releases/components/release-dashboard-history.tsx`
- `apps/studio/src/modules/releases/components/release-dashboard-panel.tsx`
- `apps/studio/src/modules/delivery/components/diff-aware-panel.tsx`
- `apps/studio/src/modules/docs/components/doc-viewer.tsx`
- `apps/studio/src/modules/docs/components/doc-viewer-toolbar.tsx`
- `apps/studio/src/modules/docs/components/ai-rewrite-panel.tsx`
- `apps/studio/src/modules/docs/components/ai-rewrite-panel-sections.tsx`
- `apps/studio/src/modules/docs/components/doc-tree.tsx`
- `apps/studio/src/modules/docs/components/rich-doc-editor.tsx`
- `apps/studio/src/components/page-outline.tsx`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`

## 更新痕迹

- 记忆：updated current-state / operating-blueprint to track t-065 light-lab UI refresh
- 索引：no change: 未更新
- 路线图：no change: 仍维持结构收口阶段的总方向
- 文档：tasks/queue/task-065-lab-light-ui-refresh.md
