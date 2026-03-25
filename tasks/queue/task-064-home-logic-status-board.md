# 任务 task-064-home-logic-status-board

## 任务摘要

- 短编号：`t-064`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把首页重构为项目逻辑态势图
- 为什么现在：
  当前首页仍以 Kernel / Project 工程视角组织内容，信息噪音高、对人类判断不友好；现在最值钱的是把首页改成可点击的项目逻辑结构图，只保留目标、里程碑、节奏、风险和下钻入口。
- 承接边界：
  只改首页 route、portal 首页读模型、首页组件与对应测试；移除首页 Kernel/Project tab 和相关旧 home surface 结构；保持 /tasks、/releases、知识库路由不变。
- 完成定义：
  首页首屏用单页逻辑态势图回答当前目标、里程碑、阶段、风险和下一步；五个节点均可点击打开对应文档或页面；健康时不再展开工程状态板，异常或待验收时才显著提醒。

## 执行合同

### 要做

- 首页头部判断区
- 逻辑结构图节点与连线
- 首页专用快照与映射
- 首页测试与相关 portal 读模型调整

### 不做

- /tasks 页面改版
- /releases 页面改版
- 新增图形库或新页面
- 改动知识库文档正文

### 约束

- 不引入新状态源
- 可视化用轻量自绘实现
- 每个节点只保留一个最相关跳转

### 关键风险

如果读模型切得不够窄，首页会继续背着工程结构；如果可视化做成纯装饰，仍然不能帮助人快速判断项目态势。

### 测试策略

- 为什么测：首页是人类主入口，最容易回退的是结构、节点跳转和异常提醒。
- 测什么：portal 首页快照、首页组件渲染、节点链接和异常态提醒。
- 不测什么：不新增 e2e 发布流测试。
- 当前最小集理由：现有 portal 单测已覆盖首页入口与 service，只要重写为逻辑图快照并补节点断言，就能用最小成本锁住新语义。

## 交付结果

- 状态：done
- 体验验收结果：
  首页已改成单页项目逻辑态势图；用户确认首屏现在更适合人类扫读，能直接看到目标、阶段、风险和下一步，且逻辑节点可点击打开对应文档或页面。
- 交付结果：
  首页 route 现在只读取首页专用的逻辑图快照；`Kernel / Project` tab、artifact health、boundary groups、工程状态板和长段系统说明都已退出首页，首页主视觉改成五个可点击节点的逻辑链。
- 复盘：
  首页最值钱的不是“再讲一遍系统结构”，而是帮助人快速判断项目态势。把首页读模型压窄、把文案收成人类判断句，比继续堆工程对象卡片的 ROI 更高。

## 当前模式

工程执行

## 分支

`main`

## 关联模块

- `apps/studio/src/app/page.tsx`
- `apps/studio/src/modules/portal/service.ts`
- `apps/studio/src/modules/portal/types.ts`
- `apps/studio/src/modules/portal/constants.ts`
- `apps/studio/src/modules/portal/builders.ts`
- `apps/studio/src/modules/portal/builders/home-logic-map.ts`
- `apps/studio/src/modules/portal/components/home-logic-board.tsx`
- `apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx`
- `apps/studio/src/modules/portal/__tests__/service.test.ts`
- `memory/project/roadmap.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`
- `docs/ARCHITECTURE.md`
- `README.md`

## 更新痕迹

- 记忆：updated current-state / operating-blueprint to focus on t-064 home logic status board
- 索引：no change: 未更新
- 路线图：mark t-064 delivered and move roadmap to next structure-tightening candidate after the home logic board landed
- 文档：README.md, docs/ARCHITECTURE.md, apps/studio/src/modules/portal/module.md, tasks/queue/task-064-home-logic-status-board.md
- 修正：tighten homepage summaries so the logic board shows concise human-facing judgments instead of echoing old Kernel/Project engineering phrasing from source docs
- 发布：accepted dev preview 20260325082914-791f8cc-dev and promoted homepage logic board to production release 20260325083655-791f8cc-prod
