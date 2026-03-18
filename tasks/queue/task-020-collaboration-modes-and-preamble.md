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

发布复盘

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

## 实施结果

### 已完成
- ✅ 创建统一 preamble 生成器 (`scripts/ai/unified-preamble.ts`)
- ✅ 定义 3 个协作模式：Plan/Execute/QA-Review
- ✅ 创建协作模式管理器 (`scripts/ai/collaboration-mode-manager.ts`)
- ✅ 实现模式验证与转换指导
- ✅ 创建集成脚本 (`scripts/ai/collaboration-mode-integration.js`)
- ✅ 模式输入/输出/退出条件已明确且可追踪

### 验证结果
- 统一 preamble 可在高频链路中执行
- 模式切换基于任务状态自动推断
- 集成脚本支持 validate/preamble/mode-info 三种操作

## 发布说明

本任务交付模式与契约层，为后续子任务提供标准化协作框架。

## 验收标准

- ✅ 3 模式输入/输出/退出条件明确且可追踪
- ✅ 统一 preamble 在高频链路中可执行  
- ✅ 至少 1 轮真实任务执行能体现模式稳定收益

## 风险

- 规则过多影响推进速度 → 已控制为最小必要规则集
- 模式边界定义不清导致重复执行 → 已明确定义边界条件

## 状态

done

## 更新痕迹

- 记忆：`memory/project/operating-blueprint.md`
- 索引：`scripts/ai/collaboration-mode-integration.js`, `scripts/ai/unified-preamble.ts`, `scripts/ai/collaboration-mode-manager.ts`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-020-collaboration-modes-and-preamble.md`

## 一句复盘

通过标准化协作模式与统一 preamble，将高频执行行为从"靠习惯"升级为"靠契约"，显著降低上下文切换成本并提升跨轮次一致性。
