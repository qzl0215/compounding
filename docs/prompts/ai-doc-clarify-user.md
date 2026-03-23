---
title: AI_DOC_CLARIFY_USER
update_mode: manual
status: active
last_reviewed_at: 2026-03-16
source_of_truth: docs/prompts/ai-doc-clarify-user.md
related_docs:
  - docs/prompts/ai-doc-rewrite-system.md
  - docs/prompts/ai-doc-rewrite-user.md
---
# 文档重构补充问题提示词

## 目标

基于当前文档和项目上下文，只提出完成高质量重构所必需的关键问题。

## 输出 JSON 结构

```json
{
  "questions": ["问题 1", "问题 2"],
  "why": ["原因 1", "原因 2"],
  "assumptions_if_unanswered": ["假设 1", "假设 2"]
}
```

## 约束

- 问题数量控制在 3 到 7 个
- 每个问题都必须直接影响文档重构质量
- 避免询问可以从当前文档直接看出来的信息
- 优先问事实缺口、边界缺口、读者定位缺口、验收标准缺口

## 调用上下文

调用方会在此提示词后附加结构化上下文 JSON，包括项目背景、文档类型、当前正文、最佳实践约束、重构强度与用户补充内容。
