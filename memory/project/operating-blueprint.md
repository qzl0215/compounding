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
  - tasks/queue/task-025-multi-agent-coordination-init.md
last_reviewed_at: 2026-03-19
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

工作模式入口与 runbook 收口（t-031）

## 关键子目标

### 子目标 1：固定规划链入口与 runbook

- 发布标准：
  - 规划链能清楚说明何时进入、需要哪些输入、会产出什么、何时退出
  - 弱 agent 能按 runbook 走到共商规划 task，而不是靠经验猜
- 关联任务：
  - `tasks/queue/task-031-work-mode-entry-and-runbook.md`

### 子目标 2：固定执行链入口与 runbook

- 发布标准：
  - 执行链的输入、产物、边界和验收前检查说明清楚
  - 模式切换不依赖散落在多份文档里的口头经验
- 关联任务：
  - `tasks/queue/task-031-work-mode-entry-and-runbook.md`

### 子目标 3：固定交付链入口与 runbook

- 发布标准：
  - 交付链能清楚覆盖质量验收、dev 预览、main 晋升与 production 验收
  - 发布和回滚动作仍保持串行与唯一真相源约束
- 关联任务：
  - `tasks/queue/task-031-work-mode-entry-and-runbook.md`

### 子目标 4：固定最小脚本契约

- 发布标准：
  - `scripts/ai/*` 与 `scripts/release/*` 中的模式提示与发布动作能对应上述三条链路
  - 文档与脚本之间不再各自发明一套切换语义
- 关联任务：
  - `tasks/queue/task-031-work-mode-entry-and-runbook.md`

## 当前阻塞

- 无结构性阻塞；核心风险在于如果 runbook 写得过重，会再次制造规则负担。

## 下一检查点

- [ ] 完成 `t-031` 的工作模式入口与 runbook 收口
- [ ] 再确认 `t-032`、`t-033` 的进入顺序与边界
- [ ] 用这份 runbook 与用户确认下一轮只吸收流程、门禁和交付产物层能力

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
