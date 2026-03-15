---
title: ADR_003_NO_NEW_GIANT_UTILS
doc_role: memory
update_mode: append_only
owner_role: Architect
status: active
source_of_truth: docs/PROJECT_RULES.md
related_docs:
  - docs/PROJECT_RULES.md
  - memory/project/tech-debt.md
last_reviewed_at: 2026-03-15
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# ADR-003 No New Giant Utils

## Context

历史上巨型 util / helper 常成为无边界逻辑堆积点。

## Decision

禁止继续扩张这类命名和承载层，优先按能力拆到清晰模块。

## Consequences

这样可以降低 AI 理解成本，也让并行修改的冲突更少。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
