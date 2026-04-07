---
title: ADR_002_THIN_AGENTS_ENTRY_CONTRACT
update_mode: append_only
status: active
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/AI_OPERATING_MODEL.md
last_reviewed_at: 2026-03-15
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# ADR-002 AGENTS 轻入口合约

## 背景

Codex 线程天然会读 AGENTS.md，但不保证额外跳转总是发生。

## 决策

把 AGENTS 定义为薄入口合约，而不是长篇规则文档。

## 影响结果

这样可以同时保证入口约束力和长期可维护性。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
