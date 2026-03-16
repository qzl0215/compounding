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

### 验证边界分层

- 发布标准：
  - 所有检查被收口为静态、构建、运行时与 AI 输出四层
  - 每层都能说明解决什么问题、失败时意味着什么
- 关联任务：
  - `tasks/queue/task-010-layered-validation-system.md`

### 推荐校验顺序

- 发布标准：
  - 本地开发和发布前都存在清晰的推荐校验顺序
  - 执行者不需要再凭经验猜“先跑哪个检查”
- 关联任务：
  - `tasks/queue/task-010-layered-validation-system.md`

### 失败语义可解释

- 发布标准：
  - 关键门禁失败时能直接说明下一步动作
  - 运行时与发布页说明不再和脚本语义冲突
- 关联任务：
  - `tasks/queue/task-010-layered-validation-system.md`

## 当前阻塞

- 当前无结构性阻塞；关键在于保持分层数量少、边界清楚，不把验证体系再次扩成新的官僚流程。

## 下一检查点

- 四层验证的名称、边界、失败语义与命令入口固定下来
- `DEV_WORKFLOW` 与 `AI_OPERATING_MODEL` 对推荐校验顺序保持一致
- `task-010` 的执行状态、分支和最近提交可追踪

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
