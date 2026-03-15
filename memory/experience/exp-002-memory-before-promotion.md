---
title: EXP_002_MEMORY_BEFORE_PROMOTION
doc_role: memory
update_mode: append_only
owner_role: Auditor
status: active
source_of_truth: memory/experience/README.md
related_docs:
  - memory/project/tech-debt.md
  - docs/PROJECT_RULES.md
last_reviewed_at: 2026-03-15
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 先记忆，再升格

## 背景

经验如果直接升格进主规则，往往会把一次性判断写成长期规则。

## 决策

先写 memory，再验证，再决定是否升格。

## 为什么

这能避免主规则快速膨胀，也让经验拥有可追溯来源。

## 影响

仓库更容易产生复利，而不是越记越乱。

## 复用

所有暂未稳定的经验都应该先进入 memory/experience。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
