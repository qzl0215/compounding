---
title: ROADMAP
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-23
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - memory/project/operating-blueprint.md
  - docs/WORK_MODES.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 路线图

## 当前阶段

High-ROI Gstack Absorption（推进中）

## 当前里程碑

Search Before Building / Autoplan / Diff-based Test Selection（推进中）

## 里程碑成功标准

- AI 在 unfamiliar pattern / infra / runtime capability 前默认先搜仓库、搜主源、再决定是否自建
- 小而边界清楚的 task 默认做完整闭环，大而跨阶段事项继续留在 plan
- AI 先扩选项、再收决策、最后产出 task，只把价值判断和体验取舍抛给人
- 测试与验证能按 diff 范围选取，不再靠继续膨胀门禁数量
- 全程不新增第二层 plan、新状态源或重型基础设施

## 当前优先级

推进 `t-044`：把 Search Before Building 与 Boil the Lake 两条高 ROI 规则落到 task 创建、pre-task 与 AI 行为链。

## 下一阶段方向

- 用真实 task 验证 Search Before Building、Autoplan、Diff-based test selection 是否稳定带来复利
- 继续吸收轻思想与判断规则，而不是复制外部框架的基础设施形态
- 在不增加新状态源的前提下，继续退休重复 provenance 和低价值门禁
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
