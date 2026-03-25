---
title: ROADMAP
update_mode: manual
status: active
last_reviewed_at: 2026-03-25
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

Structural Entropy Reduction（持续收口）

## 当前里程碑

跨页面唯一 snapshot 收口

## 里程碑成功标准

- 首页、任务页、发布页对同一项目状态只读一套主摘要，不再各自翻译
- release、runtime 和 task 的状态口径不再分散在多个本地适配器里
- 不新增新状态源、后台表或重型同步层
- 结构收口优先于视觉扩张

## 当前优先级

首页逻辑态势图已经落地到 production；下一步优先压跨页面唯一 snapshot 和 release 单一状态机，防止状态口径在首页、任务页、发布页之间重新漂移。

## 下一阶段方向

- 继续压跨页面唯一 snapshot
- 继续压实 release 单一状态机，避免 task / release / runtime 重新长出平行口径
- 继续在不增加新状态源的前提下退休低价值解释层和重复外壳
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
