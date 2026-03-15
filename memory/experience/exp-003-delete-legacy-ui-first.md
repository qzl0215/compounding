---
title: EXP_003_DELETE_LEGACY_UI_FIRST
doc_role: memory
update_mode: append_only
owner_role: Builder
status: active
source_of_truth: memory/experience/README.md
related_docs:
  - docs/REFACTOR_PLAN.md
  - memory/project/tech-debt.md
last_reviewed_at: 2026-03-15
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Delete Legacy UI First

## Context

当前仓库曾经存在大量已退役的 workflow 页面和 API。

## Decision

优先删除半活前台，再谈新骨架。

## Why

对 AI 来说，错误入口比缺入口更糟。

## Impact

清理后只剩首页和文档页，Studio 角色更清楚。

## Reuse

以后凡是退役前台，都应该先从构建入口清掉，再决定是否归档。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
