---
title: EXP_005_DIFF_AWARE_QA_REVIEW_RETRO
update_mode: append_only
status: active
source_of_truth: memory/experience/README.md
related_docs:
  - tasks/queue/task-032-diff-aware-qa-review-retro.md
  - docs/DEV_WORKFLOW.md
  - docs/AI_OPERATING_MODEL.md
  - apps/studio/src/modules/delivery/diff-aware.ts
last_reviewed_at: 2026-03-19
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 差异感知 QA / Review / Retro 产物

## 背景

仓库已经有静态、构建、运行时和 AI 输出门禁，但 review / retro / ship log 仍偏手工组织。若不把产物做成 diff-aware 的派生层，后续高频改动仍会反复拼检查、拼结论、拼复盘。

## 决策

把 QA / Review / Retro 产物统一成一份轻量派生快照，基于当前 diff、风险和现有门禁层生成：

- scope 摘要
- review 摘要
- retro 摘要
- ship log
- 建议检查

## 为什么

- 让同类改动得到相近的检查建议
- 避免 review 和 retro 重新长成重表单
- 保持 `task / release / delivery` 的真相边界不变，只收口派生展示层

## 影响

- `scripts/ai/diff-aware-qa-orchestrator.js` 产出结构化摘要
- `/tasks` 和 `/releases` 可消费同一份 diff-aware 产物
- 高价值复盘可以继续沉淀到 `memory/experience/*`

## 复用

- 以后再做 review、retro 或 ship log 时，先问它是不是由 diff 和风险驱动的派生产物
- 若某个摘要开始承载决策真相，就应回退到主源文档，而不是继续扩 diff-aware 产物
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
