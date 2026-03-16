---
title: OPERATING_BLUEPRINT
doc_role: planning
update_mode: manual
owner_role: PMO
status: active
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/current-state.md
  - tasks/queue/task-001-repo-refactor.md
last_reviewed_at: 2026-03-16
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

知识库富文本直编与两步 AI 文档重构收口

## 关键子目标

### 正文富文本直编

- 发布标准：
  - 文档默认在原阅读界面内直接编辑正文
  - 标题、段落、列表、引用、代码块、表格单元格都可直接修改
- 关联任务：
  - `tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md`

### 正文与系统元数据分层

- 发布标准：
  - 默认编辑模式不暴露 frontmatter 与 managed block
  - 高级模式才允许编辑完整 Markdown 原文
- 关联任务：
  - `tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md`

### 两步 AI 文档重构

- 发布标准：
  - 第一步只提出关键补充问题，不直接改文
  - 第二步基于用户补充重构正文，并给出结构摘要与缺失提示
- 关联任务：
  - `tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md`

### Prompt 资产治理

- 发布标准：
  - prompt 文档可在 UI 中预览与编辑
  - prompt 变更后可保存生效，并支持回退到上一版本
- 关联任务：
  - `tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md`

## 当前阻塞

- 暂无结构性阻塞；当前主要风险是复杂 Markdown 结构在正文模式下可能丢失格式细节，需要继续用测试守住序列化边界。

## 下一检查点

- 正文直编、保存与高级模式切换在知识库页面可用
- AI 补充问题与正文重构两步链路可用
- prompt 预览、保存与回退链路可用

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
