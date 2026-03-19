# 下一阶段路线图与交付边界规划

## 短编号

t-035


## 目标

为 Autonomous Multi-Agent Delivery Framework 的首个实现阶段定义清晰边界、冻结项和成功标准。


## 为什么

当前多 Agent 协作骨架、diff-aware 产物、pre-task 安全护栏与发布链已基本成型，但首个 Delivery Framework 实现阶段仍未被明确界定。若不先收口规划，再开实现任务会重新引入 roadmap、current-state 与 task 边界漂移。


## 范围

- 盘点当前多 Agent 协作层、diff-aware 产物、pre-task 安全护栏与发布链的现状
- 明确 Autonomous Multi-Agent Delivery Framework 第一阶段的目标、范围、范围外、成功标准与冻结项
- 创建首个实现任务 `t-036`
- 回写 roadmap / current-state / operating-blueprint，使下一阶段边界口径一致

## 范围外

- 不直接实现 `t-036`
- 不重做当前 `main / dev / prod` 发布模型
- 不引入浏览器 daemon、Bun 原生运行时或新的重型 orchestration UI

## 约束

- 继续以 Markdown 为真相源，不新增新的持久化状态仓库
- 第一阶段必须直接承接现有 `agent-coordination/*` 与 `scripts/coord/*` 骨架
- 规划结论必须能映射到一条可立即执行的 task，而不是停留在抽象愿景

## 关联模块

- `memory/project/roadmap.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`
- `memory/experience/exp-006-delivery-framework-phase-one-boundary.md`
- `agent-coordination/*`
- `scripts/coord/*`
- `tasks/queue/task-035-next-phase-planning.md`
- `tasks/queue/task-036-delivery-framework-phase-one.md`

## 当前模式

质量验收


## 分支

`codex/task-035-next-phase-planning`


## 最近提交

`auto: branch HEAD`

## 交付收益

把下一阶段从模糊方向收口成可直接开工的边界，避免 roadmap、current-state 与后续实现任务再次漂移。


## 交付风险

如果规划边界收得太大，`t-036` 会重新变成大而散的系统工程；如果收得太小，又无法真正把 Delivery Framework 从骨架推进到闭环。


## 一句复盘

先把 Phase 1 定成“任务伴随体与交付契约闭环”，比直接扩 orchestration UI 或浏览器基础设施更符合当前仓库的复利路径。


## 主发布版本

未生成


## 关联发布版本

无


## 计划

1. 盘点当前 coordination 能力，明确 Delivery Framework 第一阶段必须承接的基础。
2. 把第一阶段边界压缩成“任务伴随体与交付契约闭环”，并明确范围外事项。
3. 创建 `t-036`，让下一条实现任务可以直接按规划边界开工。

## 发布说明

完成后先生成 `dev` 预览；若验收通过，再晋升到 `main` 与本地生产。

## 验收标准

- roadmap / current-state / operating-blueprint 对下一阶段口径一致
- 能用一句话说清第一阶段到底做什么、明确不做什么
- `t-036` 已创建，且目标、范围、成功标准可直接支撑后续实现

## 风险

- 若规划文档与 `t-036` 边界不一致，后续实现仍会漂移
- 若把第一阶段扩到 orchestration UI、浏览器 daemon 或新数据库，会立刻把当前主线做重

## 状态

doing

## 更新痕迹

- 记忆：`memory/project/current-state.md, memory/project/operating-blueprint.md, memory/experience/exp-006-delivery-framework-phase-one-boundary.md`
- 索引：`no change: planning and task creation only`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-035-next-phase-planning.md, tasks/queue/task-036-delivery-framework-phase-one.md`

## 复盘
