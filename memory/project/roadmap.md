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

建立分层验证体系

## 下个里程碑

把现有检查收口成静态、构建、运行时与 AI 输出四层门禁，并明确发布前推荐校验顺序。

## 里程碑成功标准

- 执行者能一眼区分静态、构建、运行时与 AI 输出四层门禁
- 发布前推荐校验顺序明确，失败语义与下一步动作可解释
- `/releases`、`/tasks` 与本地运行时状态能对齐到同一套门禁分层
- `AGENTS`、`DEV_WORKFLOW`、`AI_OPERATING_MODEL` 对推荐校验顺序与边界语义保持一致

## 当前优先级

建立分层验证体系，把现有检查收口成静态、构建、运行时与 AI 输出四层门禁，并明确发布前推荐校验顺序。

## 当前执行待办

- [ ] 盘点现有检查，划分静态、构建、运行时与 AI 输出四层边界
- [ ] 在 `docs/DEV_WORKFLOW.md` 中明确推荐校验顺序与失败语义
- [ ] 让 `/releases`、`/tasks` 与本地运行时状态页都能对齐到统一的门禁分层
- [ ] 为下一轮 task-010 准备最小实现边界与验收标准

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
