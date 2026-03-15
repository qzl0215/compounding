---
title: TECH_DEBT
doc_role: memory
update_mode: append_only
owner_role: Architect
status: active
last_reviewed_at: 2026-03-12
source_of_truth: docs/memory/tech-debt.md
related_docs:
  - AGENTS.md
  - docs/planning/backlog.md
  - docs/reference/architecture.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Tech Debt

## 当前技术债

- proposal 引擎仍以 deterministic synthesis 为主，后续可升级质量，但不应引入高管理成本
- 只读门户已收口，但仍需持续清理 archive 之外的陈旧引用

## 收敛原则

- 技术债必须指向一个收敛方向
- 若不进入近期主线，则写入 `docs/planning/backlog.md`

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/memory/tech-debt.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
