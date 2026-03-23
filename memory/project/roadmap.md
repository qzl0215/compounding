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

Single-Plan Boundary Simplification（推进中）

## 当前里程碑

Plan / Task / Companion / Release 最简边界（进行中）

## 里程碑成功标准

- `operating-blueprint` 成为唯一 plan 主源，`roadmap` 只保留战略摘要与方向
- task 继续只保留执行合同，不再回流机器 provenance
- companion 只保留机器执行上下文，不再持久化 task 正文镜像
- release 只保留验收与运行事实，task 摘要只在历史兼容时回退到最小 `delivery_snapshot`
- `/tasks` 与 `/releases` 默认优先从 task 合同解析人类语义，历史数据仍可兼容读取

## 当前优先级

完成 `t-042`：把 `plan / task / companion / release` 的边界彻底切开，避免 AI 再在四类对象之间来回猜真相。

## 下一阶段方向

- 验证这套最简边界在真实任务、release 和 companion 生命周期里的长期稳定性
- 在不增加第二层 plan 或新状态源的前提下，继续压缩多余 provenance 和重复文案
- 继续用风险驱动最小测试集保护结构主线，而不是扩张门禁数量
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
