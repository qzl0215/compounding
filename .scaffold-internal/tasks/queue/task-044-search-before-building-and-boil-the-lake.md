# 任务 task-044-search-before-building-and-boil-the-lake

## 任务摘要

- 短编号：`t-044`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  落地 Search Before Building 与 Boil the Lake 的执行边界规则
- 为什么现在：
  当前仓库已经有单层 plan、task 执行合同和最小 companion / release 边界，但 AI 仍可能在不熟悉模式上过早自建，或把小而清楚的事情做成 90% 半成品。
- 承接边界：
  只把“先搜再造”和“小事做透、大事留在 plan”这两条原则嵌入现有 task 创建、pre-task 与 AI 行为规则，不改发布模型，不扩新页面。
- 完成定义：
  AI 在进入 unfamiliar pattern / infra / runtime capability 时，会先搜仓库、搜主源、再决定是否自建；小而边界清楚的 task 默认做完整闭环，不再以半成品形式结束。

## 执行合同

### 要做

- 把 Search Before Building 写入 `AGENTS`、`AI_OPERATING_MODEL`、`DEV_WORKFLOW` 与必要的 pre-task / plan prompt。
- 把 Boil the Lake 写入 task 边界规则、task 模板与 task 校验器。
- 补最小 companion / machine facts，用于记录是否完成了 search evidence 和是否属于“应做透的小 task”。

### 不做

- 不引入新的搜索平台、知识库数据库或浏览器自动化基础设施。
- 不要求每次都产出长篇调研报告。
- 不把大而跨阶段事项强行压进一个 task。

### 约束

- 搜索优先是为了减少重复造轮子，不是为了制造新的 paperwork。
- “做透”只适用于边界清楚的小 task；大事必须继续留在 plan。
- 不新增新的长期状态源。

### 关键风险

- 如果 search evidence 设计过重，AI 会被额外文书拖慢。
- 如果 Boil the Lake 缺少边界条件，小 task 会失控扩张。

### 测试策略

- 为什么测：这条主线直接影响 AI 默认动作和 task 边界，回归风险高。
- 测什么：task 创建前后的 search evidence 记录、task 边界校验、pre-task 提示与最小闭环规则。
- 不测什么：不为纯文案变更补 UI 测试，也不为每种搜索来源分别做重复测试。
- 当前最小集理由：只锁“是否先搜”“是否该做透”“是否仍然低熵增”三个高价值行为。

## 交付结果

- 状态：done
- 体验验收结果：
  Search Before Building 已进入 pre-task 与 companion 的最小 search evidence 链；Boil the Lake 已进入 task 模板、create-task 与默认完成策略，页面与流程没有新增额外 paperwork。
- 交付结果：
  AI 在 unfamiliar pattern / infra / runtime capability 上会先搜仓库、主源与经验，再决定是否自建；小而边界清楚的 task 默认按 `close_full_contract` 做完整闭环。
- 复盘：
  最值钱的不是再加一层流程，而是把已有半成品链路接通，并把搜索证据保持在最小机器事实层。
