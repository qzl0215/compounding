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

任务与发布关系升级为交付批次模型

## 关键子目标

### release 与 task 的边界收口

- 发布标准：
  - release 默认记录 1 个主 task，可选少量辅助 task
  - task 仍然是执行边界，release 仍然是验收与回滚边界
- 关联任务：
  - `tasks/queue/task-017-delivery-batch-model.md`

### 任务页交付摘要表

- 发布标准：
  - `/tasks` 默认展示任务摘要、收益、风险、状态、版本与复盘
  - 默认不需要读分支、提交、模块也能判断是否介入
  - 工程明细在展开后仍然可读
- 关联任务：
  - `tasks/queue/task-017-delivery-batch-model.md`

### 验收与回滚动作不混乱

- 发布标准：
  - 任务页只承接“验收通过 / 回滚版本”两类高价值动作
  - `/releases` 继续保留完整发布控制台职责
  - 页面与聊天都调用同一份 release registry 动作
- 关联任务：
  - `tasks/queue/task-017-delivery-batch-model.md`

## 当前阻塞

- 当前无结构性阻塞；关键在于用最少的数据模型把 task、release 和人工介入动作讲清楚，而不是继续堆更多工程细节。

## 下一检查点

- 明确 release registry 需要补的交付字段
- 确定任务页默认列与展开层的边界
- 跑通“主 task 创建 dev → 验收通过 → 回滚版本”的链路

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
