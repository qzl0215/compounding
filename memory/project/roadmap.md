---
title: ROADMAP
update_mode: manual
status: active
last_reviewed_at: 2026-03-24
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

Single-Plan Execution Boundary Simplification（持续收口）

## 当前里程碑

废除规划 task，保留单一 plan

## 里程碑成功标准

- `operating-blueprint` 继续作为唯一 plan 主源，承接待思考、待规划、计划边界和计划产出任务
- planning 不再对应“规划 task”对象，模糊事项默认回到 plan
- `task` 只表示可执行结果，不再默认落到 `战略澄清 / 方案评审`
- `/tasks` 只展示执行事项，首页的 `planning` 只来自 `operating-blueprint`
- 大 task 发现边界过大时，剩余范围回到 plan，再派生多个 sibling tasks

## 当前优先级

推进 `t-052`：保留单一 plan、废除规划 task，并把 planning 只保留为阶段动作。

## 下一阶段方向

- 把大 task 拆分回 plan 的规则写清，避免执行层重新长成树
- 再评估 `scripts/ai` 重复编排和兼容层残留，优先收真正会继续制造对象歧义的入口
- 继续在不增加新状态源的前提下退休低价值解释层和静态噪音
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
