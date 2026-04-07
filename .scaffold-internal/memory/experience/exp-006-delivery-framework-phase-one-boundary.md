---
title: EXP_006_DELIVERY_FRAMEWORK_PHASE_ONE_BOUNDARY
update_mode: append_only
status: active
source_of_truth: memory/experience/README.md
related_docs:
  - memory/project/roadmap.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-035-next-phase-planning.md
  - tasks/queue/task-036-delivery-framework-phase-one.md
last_reviewed_at: 2026-03-20
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Delivery Framework Phase 1 边界

## 背景

到 `t-034` 为止，仓库已经具备：

- `task / release / dev / prod` 的清晰交付边界
- diff-aware QA / Review / Retro 产物
- pre-task 安全护栏
- 多 Agent coordination 骨架、manifest、lock、task companion、decision card 与 review 命令链

缺的不是更多脚本，而是把这些离散能力收成一个最小交付闭环。

## 决策

Autonomous Multi-Agent Delivery Framework 的第一阶段，固定为：

**任务伴随体与交付契约闭环**

也就是把 task companion 从“任务前骨架”提升成覆盖 `create / pre-task / handoff / review / release` 的 machine-readable delivery contract。

## 为什么选这个边界

- 它直接承接现有 `agent-coordination/*` 与 `scripts/coord/*`，不需要重做底座
- 它能把现在离散的 coordination 产物真正收口成闭环
- 它优先补“状态与证据的一致性”，符合本项目当前最值钱的方向
- 它避免过早扩到浏览器 daemon、重型 orchestration UI、数据库和复杂评估平台

## Phase 1 包含什么

- companion contract 的标准字段与真相边界
- `coord:task:create / start / handoff / merge` 的生命周期回写
- pre-task、review、diff-aware 与 release handoff 对同一 companion 上下文的共享
- 最小闭环：创建任务 -> pre-task -> handoff -> review -> release handoff

## Phase 1 明确不做什么

- 不做新的 orchestration UI
- 不做浏览器 daemon
- 不做 Bun 原生运行时替换
- 不做数据库或新的持久化状态仓库
- 不追求一次性解决所有多任务并行调度问题

## 影响

- `t-036` 成为下一条实现主线
- 后续若继续扩 Delivery Framework，优先沿 companion-driven contract 演进
- 任何偏离该边界的新能力，都必须先重新回到 roadmap / operating-blueprint 讨论

## 复用

- 当系统已经具备多条零散脚本链时，下一阶段最值得做的通常不是新平台，而是把现有骨架收成闭环
- 先收口 machine-readable contract，再扩 UI 和 orchestration，能显著降低后续返工

## 阶段结果

Phase 1 已完成并验收通过。`t-036` 已把 companion-driven delivery contract 收口为最小闭环，`create / pre-task / handoff / review / release handoff` 现在共享同一份 companion 上下文。当前阶段的主要价值不是再扩字段，而是证明现有 coordination 骨架可以围绕一份统一交付契约稳定运行。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
