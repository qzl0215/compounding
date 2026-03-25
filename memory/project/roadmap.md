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

派生产物语义收口

## 里程碑成功标准

- `code_index/*`、`output/*`、`agent-coordination/*` 与 runtime 事实都被明确当作派生产物，而不是并列状态源
- 首页、任务页和发布页继续消费统一读模型语义，不为派生产物再长出新解释层
- 不新增新状态源、重型框架或平行读模型
- 本地 production 继续稳定，且保持无 `pending dev`

## 当前优先级

优先把 `code_index / output / agent-coordination / runtime` 收成统一派生产物语义，减少“缓存 / 报告 / 运行事实”并列心智。

## 下一阶段方向

- 在派生产物语义收口后，再把跨页面摘要继续压成唯一 snapshot
- 继续压实 release 单一状态机，避免 task / release / runtime 重新长出平行口径
- 继续在不增加新状态源的前提下退休低价值解释层和重复外壳
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
