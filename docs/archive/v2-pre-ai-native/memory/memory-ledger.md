---
title: MEMORY_LEDGER
doc_role: memory
update_mode: append_only
owner_role: Auditor
status: active
last_reviewed_at: 2026-03-12
source_of_truth: docs/memory/memory-ledger.md
related_docs:
  - AGENTS.md
  - docs/memory/decisions.md
  - docs/reference/principles-and-boundaries.md
  - docs/planning/roadmap.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Memory Ledger

## 本文档的角色

- 新经验先进入这里，不直接污染 `AGENTS.md`
- 经验被重复验证后，进入 Promotion Candidates
- 真正稳定的经验再升格回主源或 `docs/reference/*`

## New Learnings

- 当前阶段围绕“加固 AGENTS 单主源验收与自动校验，确保主源、roadmap 与执行链始终一致。”持续收集可复用经验。
- 任何经验在未重复验证前，都只应停留在记忆层。

## Promotion Candidates

- 若某条经验重复出现 2 次以上且无明显例外，应考虑提升进 `AGENTS.md`
- 若某条经验只在专项场景生效，应提升进对应 `docs/reference/*`
- 若经验只出现 1 次、边界不清晰、或仍有明显反例，不得直接升格

## Rule Update Gate

- 若现有规则已明显拖慢 `docs/planning/roadmap.md` 当前主线、增加重复管理成本、或与当前证据冲突，可直接改规则
- 直接改规则时，必须同步更新 `AGENTS.md`、对应 `docs/reference/*` 和 `docs/memory/decisions.md`
- 若只是局部技巧优化、一次性观察、或尚未反复验证，先留在记忆层，不直接改规则

## Promoted To

- 当前还没有新增升格记录；后续在 ratified note 确认后补链接和日期。

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/memory/memory-ledger.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
