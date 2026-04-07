# 任务 task-057-home-kernel-project-tabs

## 任务摘要

- 短编号：`t-057`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把首页从单一需求总览 hero 重构为 `Kernel / Project` 双 Tab 入口，并让 `portal` 同时读取 Markdown 主源、交付投影与 kernel/shell MVP 产物。
- 为什么现在：
  当前首页只保留一屏决策摘要，尚未把跨项目可复用的 AI 工程规范与当前项目的执行态势拆开；Kernel/Shell MVP 产物已存在，需要有对应的首页可视化入口。
- 承接边界：
  只改首页和 `portal` 读模型；不改左侧导航命名，不改任务页/证据页/发布页职责，不新增首页执行动作。
- 完成定义：
  首页默认显示 `Project` Tab，并可切到 `Kernel` Tab；Project 视图能显示项目身份、执行态势、attach/audit/proposal 状态与项目边界；Kernel 视图能显示规范入口、治理摘要、缺失态和升级路径；相关服务层与组件测试通过。

## 执行合同

### 要做

- 扩展 `portal` 类型与服务层，新增 `KernelTabSnapshot`、`ProjectTabSnapshot` 以及 YAML 产物读取与缺失态投影。
- 读取并组合 `bootstrap/project_brief.yaml`、`output/bootstrap/bootstrap_report.yaml`、最新 `output/proposals/*/proposal.yaml`。
- 重构首页组件为共享页头 + 双 Tab，并分别实现 Kernel / Project 视图卡片。
- 补首页服务层与组件测试，覆盖默认 Tab、切换、YAML 缺失回退和内核资产缺失态。

### 不做

- 不重命名左侧导航，不把 Kernel / Project 扩展成全站双体系。
- 不把任务页、发布页明细列表搬回首页。
- 不修改 bootstrap 引擎、schema/template 产物或 release/runtime 行为。

### 约束

- 首页继续只做判断入口，不承接编辑、执行或聊天动作。
- 保持现有深色视觉语言与卡片体系，但让 Kernel / Project 两个视图的语义层级明显区分。
- YAML 产物必须做存在性检查；报告中声明但仓库中缺失的资产只能显示为缺失/待补齐，不能伪装为已存在事实。

### 关键风险

- 若直接信任 `bootstrap_report` 中的资产列表，页面会把未真实落地的内核资产误显示为已就绪。
- 若首页重新平铺任务/发布细节，容易回退成旧工作台而不是判断入口。

### 测试策略

- 为什么测：首页这轮同时改数据模型和渲染结构，最容易出现事实缺口、默认态错误和视图回退。
- 测什么：`portal` 服务层快照、YAML 缺失回退、Kernel 缺失态、首页默认 Project Tab 和 Tab 切换渲染。
- 不测什么：不新增浏览器端 E2E，不改任务页/证据页/发布页现有测试。
- 当前最小集理由：先锁住首页新读模型和双视图结构的关键风险，再决定是否扩大到视觉级回归。

## 交付结果

- 状态：done
- 体验验收结果：
  首页默认进入 `Project` Tab，可切到 `Kernel` Tab；Project 视图能同时展示项目身份、执行态势、attach/audit/proposal 状态、项目边界与下钻入口；Kernel 视图能展示规范入口、治理摘要、缺失态和标准升级路径。
- 交付结果：
  `portal` 读模型已扩展为双视图快照，新增对 `bootstrap/project_brief.yaml`、`output/bootstrap/bootstrap_report.yaml`、最新 `output/proposals/*/proposal.yaml` 的读取与缺失态投影；首页组件已改为共享页头 + `Kernel / Project` 双 Tab，并补齐 live snapshot、缺失 YAML、缺失资产和默认/切换渲染测试。
- 复盘：
  这轮真正需要收的是首页信息分层，而不是再加一层 hero 文案；把 YAML 产物读取单独收成 `portal` 内部最小解析层后，缺失态和未来 manifest 接入都能继续沿同一条读模型扩展。

## 当前模式

工程执行

## 分支

`main`

## 关联模块

- `tasks/queue/task-057-home-kernel-project-tabs.md`
- `agent-coordination/tasks/`
- `apps/studio/src/modules/portal/`
- `apps/studio/src/app/page.tsx`

## 更新痕迹

- 记忆：`no change: 本轮先做首页与 portal 读模型，不改 memory 主源`
- 索引：`no change: 未更新`
- 路线图：`no change: 未更新`
- 文档：`no change: 未更新`
