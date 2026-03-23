---
title: PRINCIPLES_AND_BOUNDARIES
doc_role: reference
update_mode: promote_only
status: active
last_reviewed_at: 2026-03-12
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/reference/execution-system.md
  - docs/operations/reporting-contract.md
  - docs/memory/decisions.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Principles And Boundaries

## 本文档的角色

- 这里只放规则、边界、风险和裁决原则。
- 它解释 `AGENTS.md`，但不与主源竞争入口地位。

## Stable Principles

- 所有规则都必须有唯一归宿
- 默认采用 proposal-preview-confirm-apply
- 新增结构必须解释如何创造复利
- 所有报告默认区分本地证据与服务器证据

## Must Protect

- AGENTS.md 是唯一主源
- Git 文件即真相
- 关键改动先 review 再写入
- 不引入平行规则体系

## High Risk Actions

- 跳过 review 直接改写仓库
- 引入新的平行治理体系
- 无证据扩张 agent 的职责边界

## Rule Boundary

- 高频执行规则先写进 `AGENTS.md`
- 稳定但低频的原则进入 `reference/*`
- 临时经验不得直接写进这里，必须先进入 `docs/memory/memory-ledger.md`
- 若现有规范正在限制复利效率，应先更新规范本身；不得为了绕开旧规则而新建平行体系

## Promotion And Rule Update Criteria

- 只有重复验证、边界清晰、且对当前主线持续有效的经验，才允许升格进 `AGENTS.md` 或 `reference/*`
- 若经验稳定但只在专项场景成立，应提升进对应 `reference/*`，而不是污染 `AGENTS.md`
- 若现有规则已明显拖慢 `docs/planning/roadmap.md` 当前主线、增加重复管理成本、或与当前证据冲突，可直接更新规则
- 直接改规则时，必须同步更新 `AGENTS.md`、相关 live docs 和 `docs/memory/decisions.md`

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/reference/principles-and-boundaries.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
