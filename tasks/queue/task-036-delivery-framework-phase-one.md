# Delivery Framework Phase 1：任务伴随体与交付契约闭环

## 短编号

t-036


## 目标

把 task companion 从任务前骨架升级成覆盖 create / pre-task / handoff / review / release 的交付契约闭环。


## 为什么

当前 coordination 产物已经有 manifest、lock、task companion、decision card 与 review 骨架，但这些能力仍偏离散。若不先把 companion-driven delivery contract 做成第一阶段闭环，后续多 Agent 执行仍会停留在零散脚本拼接，而不是可追踪的 Delivery Framework。


## 范围

- 把 task companion 升级成统一的 machine-readable delivery contract
- 打通 `coord:task:create / start / handoff / merge` 对 companion 的生命周期回写
- 让 pre-task、review、diff-aware 与 release handoff 能共享同一份任务伴随体上下文
- 输出最小闭环：创建任务 -> pre-task -> handoff -> review -> release handoff
- 允许为这轮闭环补最小文档、主线快照与脚本级回归测试

## 范围外

- 不扩新的 orchestration UI
- 不引入浏览器 daemon、Bun 原生运行时或数据库
- 不追求一次性覆盖多任务并行调度的全部复杂场景

## 约束

- 继续复用现有 `agent-coordination/*` 和 `scripts/coord/*`，不重做底座
- 继续沿用现有 `main / dev / prod` 发布链
- delivery contract 必须服务于任务和 release 闭环，不新增平行真相源

## 关联模块

- `agent-coordination/tasks/`
- `agent-coordination/manifest/`
- `agent-coordination/reports/`
- `scripts/coord/task.ts`
- `scripts/coord/check.ts`
- `scripts/coord/review.ts`
- `scripts/coord/diff-summary.ts`
- `scripts/coord/lib/task-meta.ts`
- `scripts/coord/lib/companion-lifecycle.ts`
- `scripts/release/lib.ts`
- `scripts/release/prepare-release.ts`
- `scripts/release/accept-dev-release.ts`
- `scripts/release/switch-release.ts`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`
- `memory/project/roadmap.md`
- `apps/studio/src/modules/portal/__tests__/service.test.ts`
- `tests/test_coord_cli.py`
- `tasks/queue/task-036-delivery-framework-phase-one.md`

## 当前模式

工程执行


## 分支

`codex/task-036-delivery-framework-phase-one`


## 最近提交

`auto: branch HEAD`

## 交付收益

让多 Agent 协作从“零散脚本拼接”提升到“围绕任务伴随体驱动的交付闭环”，后续 review、release 与复盘都能读到同一份机器可读上下文。


## 交付风险

如果 companion contract 设计过宽，后续会重新长出第二套状态仓库；如果只补字段不补生命周期回写，仍然会停留在半闭环状态。


## 一句复盘

未复盘


## 主发布版本

未生成


## 关联发布版本

无


## 计划

1. 明确 companion contract 的标准字段和真相边界。
2. 打通 create / pre-task / handoff / merge 对 companion 的状态回写。
3. 让 review 与 release handoff 能消费同一份 companion 产物。

## 发布说明

本任务当前在短分支开发中；待 companion lifecycle 闭环完成后进入 `dev` 预览验收。

## 验收标准

- companion 成为单一 machine-readable delivery contract，而不是又一份手工状态表
- `coord:task:create / start / handoff / merge` 对同一任务的 companion 生命周期回写一致
- release handoff 可直接读取 companion 输出的交付上下文，而不是重新人工拼接

## 风险

- 若 companion contract 与 task/release 边界混淆，会再次制造重复真相
- 若生命周期只打通一半，会留下更多“看似自动、实际双写”的状态

## 状态

doing

## 更新痕迹

- 记忆：`memory/project/current-state.md`, `memory/project/operating-blueprint.md`
- 索引：`no change: companion contract implementation does not alter generated index boundaries yet`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-036-delivery-framework-phase-one.md`, `docs/DEV_WORKFLOW.md`, `docs/AI_OPERATING_MODEL.md`

## 复盘
