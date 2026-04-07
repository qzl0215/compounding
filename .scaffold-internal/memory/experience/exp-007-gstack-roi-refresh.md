---
title: EXP_007_GSTACK_ROI_REFRESH
update_mode: append_only
status: active
source_of_truth: memory/experience/README.md
related_docs:
  - memory/project/roadmap.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-043-gstack-roi-absorption-refresh.md
  - tasks/queue/task-044-search-before-building-and-boil-the-lake.md
  - tasks/queue/task-045-autoplan-human-judgment-contract.md
  - tasks/queue/task-046-diff-based-test-roi-selection.md
last_reviewed_at: 2026-03-23
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# gstack 高 ROI 吸收刷新

## 背景

`t-030` 已经把 gstack 的总体引入边界固定住了，但那一轮更像“哪些能吸、哪些不能吸”的总判断。现在仓库已经完成单层 plan、task 执行合同、最小 companion 和最小 release 边界，适合再看一轮：哪些思想在当前阶段仍然高 ROI，而且不会重新制造熵增。

## 决策

当前阶段继续吸收 4 类轻思想：

- **Search Before Building**
  涉及 unfamiliar pattern / infra / runtime capability 时，先搜仓库、搜主源、搜成熟解，再决定是否自建。
- **Boil the Lake**
  小而边界清楚的事项默认做完整，不以 90% 半成品结束；大事则显式留在 plan。
- **Autoplan / only surface taste decisions**
  AI 先扩选项、再收决策、最后产出 task，只把价值判断和体验取舍抛给人。
- **Diff-based test selection**
  测试和验证按改动范围选，不靠继续堆门禁数量表达质量。

当前阶段继续明确不吸收：

- Bun 浏览器 daemon
- 重型本地浏览器运行时
- Claude 专属 slash-skill 生态
- 多会话 orchestration 基础设施

## 为什么

这些思想的共同点是：它们能直接嵌入当前仓库已有的 `plan / task / companion / release` 边界，不要求新增新的状态源或基础设施。真正带来复利的不是 gstack 的运行时形态，而是它在“先搜再造、先收决策再执行、按 diff 选测试、小 task 做透”上的判断规则。

## 影响

- 下一批高 ROI 执行任务固定为：
  - `t-044`：Search Before Building 与 Boil the Lake 规则落地
  - `t-045`：Autoplan 式人机决策收口
  - `t-046`：Diff-based test ROI 优化
- `operating-blueprint` 继续作为唯一 plan 主源，不引入第二层 plan。
- 未来再研究外部 AI 开发框架时，优先吸收轻规则、轻流程和读模型，而不是复制运行时或客户端生态。

## 复用

- 若一项外部经验不能直接落到当前已有对象边界，就先不吸收。
- 若一项吸收会要求新增长期状态源、重型页面或运行时，就默认排除。
- 外部框架最值得吸收的，通常是“判断规则”和“动作节奏”，不是“基础设施形态”。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
