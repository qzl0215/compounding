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
last_reviewed_at: 2026-03-20
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

Delivery Framework Phase 1 边界定义

## 关键子目标

### 子目标 1：固定 Phase 1 的核心问题

- 发布标准：
  - 明确 Phase 1 要解决的是“任务伴随体与交付契约闭环”，而不是新的 orchestration UI
  - 首个实现任务的目标、范围外、成功标准与冻结项已经固定
- 关联任务：
  - `tasks/queue/task-035-next-phase-planning.md`
  - `tasks/queue/task-036-delivery-framework-phase-one.md`

### 子目标 2：明确 Phase 1 的范围外与冻结项

- 发布标准：
  - 明确不做浏览器 daemon、Bun 原生运行时、数据库与重型 orchestration UI
  - 继续沿用 `main / dev / prod` 与 task / release 的现有交付边界
- 关联任务：
  - `tasks/queue/task-035-next-phase-planning.md`

### 子目标 3：创建首个实现任务入口

- 发布标准：
  - roadmap、current-state 与 operating-blueprint 对下一阶段口径一致
  - `t-036` 可直接作为下一条实现主线开工
- 关联任务：
  - `tasks/queue/task-035-next-phase-planning.md`
  - `tasks/queue/task-036-delivery-framework-phase-one.md`

## 当前阻塞

- 当前主要风险不是底座缺失，而是若跳过 `t-035` 直接进入 `t-036`，会把 companion contract 做成新一轮大而散的系统工程。

## 下一检查点

- [x] 完成 `t-031` 的工作模式入口与 runbook 收口
- [x] 完成 `t-032` 的差异感知 QA / Review / Retro 产物
- [x] 完成 `t-033` 的预任务安全护栏补全
- [x] 完成 `t-034` 的高 ROI 收敛修复
- [ ] 完成 `t-035` 的边界规划与主线切换
- [ ] 进入 `t-036` 的实现准备

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
