# 任务 task-020-collaboration-modes-and-preamble

## 短编号

t-020

## 目标

落地 3 个高频协作模式（Plan / Execute / QA-Review）与统一 preamble，让高频执行链路从“靠习惯”升级为“靠契约”。

## 为什么

当前执行质量高度依赖操作者经验；缺少模式切换和统一开场契约，容易导致同类任务输出不一致、提问方式漂移、验收口径不稳定。

## 范围

- 设计并固化 3 模式的输入、输出、退出条件
- 建立统一 preamble（上下文重置、任务绑定、提问契约、证据边界）
- 把模式与 task 状态关联，避免“模式存在但不被执行”

## 范围外

- 不在本任务中实现全部 QA 与 Review 自动化细则
- 不改动发布系统核心机制

## 约束

- 不新增平行规则文档，仍以 `AGENTS` 与现有 docs 为主源
- 以最小可验证改动为先，避免一轮大改

## 关联模块

- `AGENTS.md`
- `docs/WORK_MODES.md`
- `docs/AI_OPERATING_MODEL.md`
- `memory/project/operating-blueprint.md`
- `tasks/queue/task-020-collaboration-modes-and-preamble.md`

## 当前模式

方案评审

## 分支

`codex/task-020-collaboration-modes-and-preamble`

## 最近提交

`auto: branch HEAD`

## 交付收益

把高频协作行为标准化，降低上下文切换成本，并显著提升跨人/跨轮次的一致性。

## 交付风险

若 preamble 过重会拖慢节奏；若模式定义过抽象会难以执行。

## 计划

1. 梳理现有工作模式与执行入口，确定最小模式骨架。
2. 定义统一 preamble 与提问契约，并落到可复用入口。
3. 以 1-2 条真实任务链路验证模式切换和输出稳定性。

## 发布说明

本任务先交付模式与契约层，不直接修改业务页面功能。

## 验收标准

- 3 模式输入/输出/退出条件明确且可追踪
- 统一 preamble 在高频链路中可执行
- 至少 1 轮真实任务执行能体现模式稳定收益

## 风险

- 规则过多影响推进速度
- 模式边界定义不清导致重复执行

## 状态

todo

## 更新痕迹

- 记忆：`memory/project/operating-blueprint.md`
- 索引：`no change: 本轮仅新增任务编排`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-020-collaboration-modes-and-preamble.md`

## 一句复盘

未复盘
