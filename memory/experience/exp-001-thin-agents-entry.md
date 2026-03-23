---
title: EXP_001_THIN_AGENTS_ENTRY
doc_role: memory
update_mode: append_only
status: active
source_of_truth: memory/experience/README.md
related_docs:
  - AGENTS.md
  - docs/AI_OPERATING_MODEL.md
last_reviewed_at: 2026-03-15
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 保持 AGENTS 轻入口

## 背景

AGENTS 曾长期承载过多正文，导致每个线程都要吞下过重上下文。

## 决策

把 AGENTS 收口成薄入口，只保留高频执行约束和必读清单。

## 为什么

这样最符合 Codex 的天然入口读取模式，也降低主源污染风险。

## 影响

新线程更快进入有效上下文，主源更新频率更健康。

## 复用

若未来再出现高频长文倾向，应优先压回 docs / memory，而不是继续加重 AGENTS。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
