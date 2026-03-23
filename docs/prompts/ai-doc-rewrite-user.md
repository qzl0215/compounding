---
title: AI_DOC_REWRITE_USER
doc_role: reference
update_mode: manual
status: active
last_reviewed_at: 2026-03-16
source_of_truth: docs/prompts/ai-doc-rewrite-user.md
related_docs:
  - docs/prompts/ai-doc-rewrite-system.md
  - docs/prompts/ai-doc-clarify-user.md
---

# 文档重构执行提示词

## 目标

在不改变事实和系统元数据的前提下，对正文进行结构和语言重构，提高人类与 AI 的易读性。

## 输出 JSON 结构

```json
{
  "rewritten_markdown": "重构后的正文 Markdown",
  "structure_summary": ["结构变化 1", "结构变化 2"],
  "missing_information": ["缺失项 1", "缺失项 2"],
  "keep_recommendations": ["建议保留 1"],
  "remove_recommendations": ["建议删除 1"],
  "intensity_note": "本次重构强度说明"
}
```

## 重构要求

- `轻度`：统一术语、消除口语化、弱化重复
- `中度`：重组段落、补标题、压缩重复、强化阅读顺序
- `重度`：在不改变事实前提下重写结构与语言

## 约束

- 不改 frontmatter
- 不改托管标记
- 不引入当前文档与上下文中不存在的事实
- 优先保留结论，压缩解释性噪音
- 若信息不足，明确写入 `missing_information`

## 调用上下文

调用方会在此提示词后附加结构化上下文 JSON，包括项目背景、当前正文、用户补充、最佳实践约束和重构强度。
