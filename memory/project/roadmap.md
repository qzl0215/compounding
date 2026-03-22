---
title: ROADMAP
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-22
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

Single-Plan Demand Operating Model（推进中）

## 当前里程碑

Task 执行合同与机器台账下沉

## 里程碑成功标准

- task 重构成共享执行合同，只保留边界、结果、风险和测试策略
- 分支、提交、release、trace 等机器台账从 task 主体下沉到 companion / release / 投影层
- 历史 task 在不重写文档的情况下仍可被兼容解析
- `/tasks` 主表默认展示合同字段，而不是机器 provenance

## 当前优先级

把 task 从“全量档案”收口成执行合同，让 plan 负责想清楚、task 负责做清楚、release / companion 负责机器台账。

## 下一阶段方向

- 让 task 页、release 页和 companion 继续围绕同一份执行合同投影
- 让 AI 默认读 plan 与 task 合同，不再被 task 档案噪声拖慢
- 继续用风险驱动最小测试集保护结构改动，而不是追加重复门禁
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
