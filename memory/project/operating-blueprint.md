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

建立分层验证体系

## 关键子目标

### 静态门禁边界

- 发布标准：
  - 能明确列出 lint、task trace、task/Git 绑定、代码健康扫描等静态检查
  - 执行者知道哪些检查必须在本地先过
- 关联任务：
  - `tasks/queue/task-010-layered-validation-system.md`

### 构建与运行时门禁

- 发布标准：
  - 能区分 build / audit / preview health / production health 的层次边界
  - 失败时能说明是构建问题还是运行时问题
- 关联任务：
  - `tasks/queue/task-010-layered-validation-system.md`

### AI 输出门禁与推荐顺序

- 发布标准：
  - 明确 AI 输出相关检查何时进入链路、为什么进入、失败后怎么处理
  - `DEV_WORKFLOW` 给出统一推荐校验顺序
- 关联任务：
  - `tasks/queue/task-010-layered-validation-system.md`

## 当前阻塞

- 当前无结构性阻塞；关键在于把现有门禁盘点清楚，并避免把验证层次继续混写成一团。

## 下一检查点

- 明确四层门禁各自包含哪些检查与失败语义
- `/releases`、`/tasks` 与当前发布链路能映射到统一门禁分层
- `task-010` 进入执行状态并具备可追踪分支

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
