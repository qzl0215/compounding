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
last_reviewed_at: 2026-03-18
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

多 Agent 协作系统（Autonomous Multi-Agent Coordination Layer）

## 关键子目标

### 子目标 1：Agent Coordination 目录骨架与数据模型（Phase 0）

- 发布标准：
  - agent-coordination/manifest、tasks、locks、policies、reports、decisions 目录存在
  - risk-rules.json、overrides.json、execution-modes.json、escalation-policy.json、merge-policy.json 骨架就绪
- 关联任务：
  - `tasks/queue/task-025-multi-agent-coordination-init.md`

### 子目标 2：项目扫描与风险地图（Phase 1）

- 发布标准：
  - scan.ts 可生成 manifest.json（按 hard rule + heuristic）
  - 支持 overrides.json 人工降级
  - 输出初版风险报告到 agent-coordination/reports/
- 关联任务：
  - `tasks/queue/task-025-multi-agent-coordination-init.md`

### 子目标 3：Lock Registry 与 Pre-Task Check（Phase 1）

- 发布标准：
  - lock.ts 支持 acquire/release/status，持久化 lock-registry.json
  - check.ts 支持 pre-task check（preflight + lock check + task companion 创建）
- 关联任务：
  - `tasks/queue/task-025-multi-agent-coordination-init.md`

### 子目标 4：Scope Guard 与 Auto-Review 骨架（Phase 1）

- 发布标准：
  - scope-guard.ts 可比较 planned_files vs actual git diff，输出 JSON
  - review.ts 可输出 scope/lock/test reviewer 的 JSON 聚合结果
- 关联任务：
  - `tasks/queue/task-025-multi-agent-coordination-init.md`

### 子目标 5：Decision Card 与命令入口（Phase 1）

- 发布标准：
  - decision.ts 可生成 decision card JSON 到 agent-coordination/decisions/
  - package.json 已注册所有 coord:* 命令
- 关联任务：
  - `tasks/queue/task-025-multi-agent-coordination-init.md`

## 当前阻塞

- 无结构性阻塞；核心风险在于 coordination 层与现有 task/release 的同步约定需清晰。

## 下一检查点

- [x] 完成 gstack 七项实践里程碑（t-019~t-024）
- [x] 注册 t-025 并更新 roadmap / operating-blueprint / current-state
- [ ] 落地 agent-coordination 目录骨架与 JSON schema
- [ ] 实现 scan.ts / lock.ts / check.ts / scope-guard.ts / review.ts / decision.ts
- [ ] 注册 coord:* 命令及 t-026、t-027 子任务骨架

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
