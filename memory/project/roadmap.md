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

任务与发布关系升级为交付批次模型

## 下个里程碑

把任务页升级为高密度交付摘要表，并让 release registry 明确记录主 task、辅助 task、交付收益与交付风险。

## 里程碑成功标准

- release 默认绑定 1 个主 task，可选少量辅助 task
- `/tasks` 默认展示任务摘要、收益、风险、状态、版本与复盘
- `/tasks` 与 `/releases` 读取同一份 release registry 关联信息
- 人能不读工程明细也判断是否要验收通过或回滚

## 当前优先级

重构任务与发布模型，建立“1 个主 task / 1 次发布”的交付批次默认规则，并把任务页改成更高密度、更利于人工介入的交付摘要表。

## 当前执行待办

- [ ] 为 release registry 增加主 task、辅助 task 与交付摘要字段
- [ ] 让 `/releases` 创建 dev 时显式绑定主 task
- [ ] 把 `/tasks` 改成默认看交付摘要、展开看工程明细
- [ ] 明确任务页与发布页的职责分工，避免双控制台

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
