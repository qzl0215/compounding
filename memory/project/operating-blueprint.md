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

建设防漂移文档与索引资产

## 关键子目标

### Prompt 资产防漂移

- 发布标准：
  - 明确 prompt 文档的真相源、版本、回退边界
  - AI 调用链能区分哪些 prompt 适合人工维护，哪些可被校验覆盖
- 关联任务：
  - `tasks/queue/task-011-anti-drift-docs-prompts-index.md`

### 索引与关键说明文档边界

- 发布标准：
  - 模块索引、函数索引和关键说明文档的维护方式清楚
  - 不会因为引入防漂移机制而长出新的平行真相源
- 关联任务：
  - `tasks/queue/task-011-anti-drift-docs-prompts-index.md`

### 生成 / 校验 / 人工维护三分法

- 发布标准：
  - 至少一类高频资产进入可执行的防漂移机制
  - 生成、校验、人工维护三类方式的进入条件与限制条件清楚
- 关联任务：
  - `tasks/queue/task-011-anti-drift-docs-prompts-index.md`

## 当前阻塞

- 当前无结构性阻塞；关键在于先选出最值得治理的一类资产，避免一上来把所有文档都推向生成式。

## 下一检查点

- 明确 prompt、索引与关键说明文档的优先级与治理边界
- 选定第一类要建立防漂移机制的资产
- `task-011` 进入执行状态并具备可追踪分支

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
