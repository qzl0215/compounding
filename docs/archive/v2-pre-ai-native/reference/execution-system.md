---
title: EXECUTION_SYSTEM
doc_role: reference
update_mode: promote_only
owner_role: Builder
status: active
last_reviewed_at: 2026-03-12
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/reference/schemas-and-contracts.md
  - docs/operations/reporting-contract.md
  - docs/memory/memory-ledger.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Execution System

## 本文档的角色

- 这里定义执行闭环：读取、preflight、proposal、apply、audit、report。
- 真正的变更前置规则仍以 `AGENTS.md` 的 Mutation Gate 为准。

## Execution Loop

1. 先读 `AGENTS.md`
2. 按 `Read More If...` 补读专项文档
3. 改动前运行 `python3 scripts/pre_mutation_check.py`
4. 通过 preflight 后再进入实际修改或 proposal/apply
5. 结果按 `docs/operations/reporting-contract.md` 输出
6. 新经验先写 `docs/memory/memory-ledger.md`

## Promotion And Rule Update Flow

1. 只出现一次或边界不清晰的经验，先留在 `docs/memory/memory-ledger.md`
2. 重复出现 2 次以上且无明显例外的高频经验，才允许升格进 `AGENTS.md`
3. 稳定但低频的经验，升格进对应 `docs/reference/*`
4. 若现有规则已明显阻碍 roadmap 主线效率，可直接改规则，但必须同步更新 `docs/memory/decisions.md`

## Proposal And Apply

- 默认模式：`proposal-preview-confirm-apply`
- canonical 变化只能落在声明过的 managed block
- apply 前必须通过 git 基线和 block drift 校验

## Validation Modes

- `prod-live`
- `local-code-prod-data`
- `full-local`

## Default Commands

- `pnpm bootstrap:scaffold`
- `pnpm bootstrap:audit`
- `pnpm preflight`
- `pnpm test`
- `pnpm build`

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/reference/execution-system.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
