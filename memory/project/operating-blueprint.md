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

Delivery Framework Phase 1 实现准备

## 关键子目标

### 子目标 1：固定 companion contract 的核心边界

- 发布标准：
  - 明确 Phase 1 要解决的是“任务伴随体与交付契约闭环”，而不是新的 orchestration UI
  - `t-036` 已继承 `t-035` 的边界、范围外与成功标准，不需要再次回到规划层重谈范围
- 关联任务：
  - `tasks/queue/task-036-delivery-framework-phase-one.md`

### 子目标 2：打通 companion 生命周期回写

- 发布标准：
  - `coord:task:create / start / handoff / merge` 对同一任务的 companion 状态回写一致
  - pre-task、review、diff-aware 与 release handoff 能共享同一份 companion 上下文
- 关联任务：
  - `tasks/queue/task-036-delivery-framework-phase-one.md`

### 子目标 3：维持现有交付边界与范围外约束

- 发布标准：
  - 继续不做浏览器 daemon、Bun 原生运行时、数据库与重型 orchestration UI
  - 继续沿用 `main / dev / prod` 与 task / release 的现有交付边界
- 关联任务：
  - `tasks/queue/task-036-delivery-framework-phase-one.md`

## 当前阻塞

- 当前主要风险不是底座缺失，而是若 `t-036` 在实现时继续扩范围，companion contract 会重新长成第二套状态仓库。

## 下一检查点

- [x] 完成 `t-031` 的工作模式入口与 runbook 收口
- [x] 完成 `t-032` 的差异感知 QA / Review / Retro 产物
- [x] 完成 `t-033` 的预任务安全护栏补全
- [x] 完成 `t-034` 的高 ROI 收敛修复
- [x] 完成 `t-035` 的边界规划与主线切换
- [ ] 启动 `t-036` 的 companion contract 实现
- [ ] 让 review 与 release handoff 直接消费 companion 输出，而不是再次人工拼接

## 证据边界

- 本地离线证据：`t-035` 规划文档、`t-036` 任务定义、`memory/experience/exp-006-delivery-framework-phase-one-boundary.md`
- 服务器真实证据：本地生产 active release 与 `/releases` 页面应显示 `t-035` 已完成
- 当前结论适用边界：当前里程碑已从“边界定义”切到 “Phase 1 实现准备”，下一步围绕 `t-036` 的 companion-driven delivery contract 落地
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
