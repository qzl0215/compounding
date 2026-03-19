---
title: ROADMAP
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-20
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-025-multi-agent-coordination-init.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 路线图

## 当前阶段

Autonomous Multi-Agent Delivery Framework（Phase 1 已完成，下一阶段待定）

## 下个里程碑

Delivery Framework Phase 1：任务伴随体与交付契约闭环

## 里程碑成功标准

- task companion 成为单一 machine-readable delivery contract，而不是新的平行状态仓库
- `coord:task:create / start / handoff / merge` 对同一任务的 companion 生命周期回写一致
- pre-task、review、diff-aware 与 release handoff 可以共享同一份 companion 上下文
- 第一阶段明确不扩 orchestration UI、浏览器 daemon、Bun 原生运行时或数据库
- `t-036` 的实现边界可直接支撑下一轮工程执行，不需要再次回到路线图重谈范围

## 当前优先级

评估下一阶段候选任务，优先考虑运营后台首页内容简化；在确认新的主线之前，不再扩展 Delivery Framework Phase 1 的实现范围。

规划依据补充：`memory/experience/exp-006-delivery-framework-phase-one-boundary.md`

## 当前执行待办

- [x] 完成 gstack 七项实践里程碑（t-019~t-024）
- [x] 注册新里程碑任务 `t-025`（Multi-Agent Coordination Init）
- [x] 落地 agent-coordination 目录骨架与 coord 命令链（t-025）
- [x] Phase 2 auto-review 增强：contract/architecture reviewer、merge gate、pre-push hook（t-026）
- [x] Phase 3 无人值守完善：UI 产物格式、差异摘要、执行模式降级（t-027）
- [x] 完成 `t-030`，产出唯一的 `gstack -> Compounding` 对齐矩阵与引入边界
- [x] 推进 `t-031`：收口工作模式入口与 runbook
- [x] 推进 `t-032`：差异感知 QA / Review / Retro 产物
- [x] 完成 `t-033`：补齐 pre-task 安全护栏
- [x] 完成 `t-034`：统一 task resolver、修复 release cutover 时序、继续收口交付快照与任务表展示
- [x] 完成 `t-035`：明确 Delivery Framework 第一阶段边界、冻结项与成功标准
- [x] 完成 `t-036`：任务伴随体与交付契约闭环
- [ ] 评估下一阶段候选：运营后台首页内容简化

## 证据边界

- 本地离线证据：`t-035` 规划文档、`t-036` 任务定义、`memory/experience/exp-006-delivery-framework-phase-one-boundary.md`
- 服务器真实证据：本地生产 active release 与 `/releases` 页面应显示 `t-035` 已完成，当前无 pending dev
- 当前结论适用边界：当前已结束 Delivery Framework Phase 1 的规划与实现窗口；当前处于下一阶段候选评估期，尚未确认新的主线
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
