---
title: ROADMAP
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-16
source_of_truth: tasks/queue/task-001-repo-refactor.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-001-repo-refactor.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 路线图

## 当前阶段

知识库富文本直编与两步 AI 文档重构收口

## 下个里程碑

知识库进入长期可维护状态：默认在富文本阅读界面内直接编辑正文，并支持基于项目背景的两步 AI 文档重构，让人和 AI 都能更高质量地维护 Markdown 真相源。

## 里程碑成功标准

- `/knowledge-base` 默认在原阅读界面内直接编辑正文，而不是源码加预览双栏
- 带托管区块的文档在默认模式下只回写正文，高级模式下才允许编辑完整 Markdown
- AI 先提出最关键补充问题，再基于用户补充重构正文
- prompt 文档可预览、保存生效并回退到上一版本
- `roadmap / operating-blueprint / task / memory / index` 的边界继续清晰

## 当前优先级

把知识库升级为默认正文富文本直编，并接入“先提问、后重构”的两步 AI 文档重构能力。

## 当前执行待办

- [x] 知识库默认进入正文富文本直编，而不是原始源码编辑
- [x] 保留高级模式，用于全文 Markdown / frontmatter / managed block 编辑
- [x] 接入“两步 AI 重构”链路：先提问题，再重构正文
- [x] 新增 prompt 文档预览、保存生效与上一版本回退
- [x] task / memory / docs / roadmap 与当前主线保持同步

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
