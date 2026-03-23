---
title: EXPERIENCE_README
update_mode: append_only
status: active
last_reviewed_at: 2026-03-15
source_of_truth: AGENTS.md
related_docs:
  - memory/decisions/ADR-001-ai-native-repo-skeleton.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 经验记录说明

这里记录尚未升格为长期规则的经验。默认先记忆，再验证，再决定是否升格。

## 记录格式

- 背景
- 决策
- 为什么
- 影响
- 复用

## 升格候选

- 重复出现 2 次以上且无明显例外的经验，才能候选升格
- 若现有规则已直接阻碍 roadmap 主线效率，可直接改规，但必须同步写 ADR

## 可比较资产

- `experience-index.json` 由 `pnpm ai:generate-experience-index` 生成，提取 id、title、decision、reuse、path
- 供人和 AI 快速横向扫、比较、复盘；升格判断时可先看索引再决策
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
