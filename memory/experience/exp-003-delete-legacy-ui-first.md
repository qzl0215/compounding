---
title: EXP_003_DELETE_LEGACY_UI_FIRST
doc_role: memory
update_mode: append_only
status: active
source_of_truth: memory/experience/README.md
related_docs:
  - docs/REFACTOR_PLAN.md
  - memory/project/tech-debt.md
last_reviewed_at: 2026-03-15
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 先删除半活旧前台

## 背景

当前仓库曾经存在大量已退役的 workflow 页面和 API。

## 决策

优先删除半活前台，再谈新骨架。

## 为什么

对 AI 来说，错误入口比缺入口更糟。

## 影响

清理后只剩首页和文档页，Studio 职责边界更清楚。

## 复用

以后凡是退役前台，都应该先从构建入口清掉，再决定是否归档。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
