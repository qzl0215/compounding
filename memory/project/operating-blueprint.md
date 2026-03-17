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
  - 运行时代码与校验器共用同一份 prompt 注册表
  - `pnpm validate:ai-output` 能覆盖 prompt 资产完整性与引用一致性
- 关联任务：
  - `tasks/queue/task-011-anti-drift-docs-prompts-index.md`

### 索引与关键说明文档边界

- 发布标准：
  - 模块索引、函数索引和关键说明文档的维护方式清楚
  - `code_index` 的生成边界和人工补充边界清楚
  - 不会因为引入防漂移机制而长出新的平行真相源
- 关联任务：
  - `tasks/queue/task-011-anti-drift-docs-prompts-index.md`

### 生成 / 校验 / 人工维护三分法

- 发布标准：
  - 至少一类高频资产进入可执行的防漂移机制
  - `docs/ASSET_MAINTENANCE.md` 可直接回答每类资产的真相源、维护方式和命令
  - 生成、校验、人工维护三类方式的进入条件与限制条件清楚
- 关联任务：
  - `tasks/queue/task-011-anti-drift-docs-prompts-index.md`

## 当前阻塞

- 当前无结构性阻塞；关键在于先选出最值得治理的一类资产，避免一上来把所有文档都推向生成式。

## 下一检查点

- 生成资产维护矩阵
- 建立 prompt 注册表并接到 AI 输出门禁
- 明确 `code_index` 的生成与人工补充边界

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
