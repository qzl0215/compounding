# 任务 task-021-fix-first-and-layered-gates

## 短编号

t-021

## 目标

把 Fix-First 分流（AUTO-FIX vs ASK）与分层验证门禁（静态 / 构建 / 运行时 / AI 输出）收口到统一执行节奏。

## 为什么

当前门禁存在但执行体验分散；review 决策与自动修复边界不够显式，导致“能自动处理的问题也进入人工往返”。

## 范围

- 明确 AUTO-FIX 与 ASK 的可执行判定边界
- 对齐 review / ship 与既有验证门禁顺序
- 输出统一验证结果摘要，便于产品和工程共同判断是否可推进

## 范围外

- 不新增新的门禁层级
- 不把低价值检查升级为硬门禁

## 约束

- 保持“静态 -> 构建 -> 运行时 -> AI 输出”顺序
- 门禁输出必须给出下一步动作，不只给失败信号

## 关联模块

- `docs/PROJECT_RULES.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `memory/project/current-state.md`
- `tasks/queue/task-021-fix-first-and-layered-gates.md`

## 当前模式

方案评审

## 分支

`codex/task-021-fix-first-and-layered-gates`

## 最近提交

`auto: branch HEAD`

## 交付收益

减少低价值人工往返，让高风险问题更早暴露并进入明确决策，提升交付效率和可预期性。

## 交付风险

AUTO-FIX 边界若定义过宽，可能引入误修；定义过窄则收益不足。

## 实施结果

### 已完成
- ✅ 创建 Fix-First 编排器 (`scripts/ai/fix-first-orchestrator.js`)
- ✅ 定义 4 层门禁链路：静态检查 → 构建检查 → 运行时检查 → AI 输出检查
- ✅ 实现 AUTO-FIX / ASK 分流规则：
  - AUTO-FIX：低风险且可自动修复（如 lint 自动修复）
  - ASK：高风险、构建/运行时/AI 输出问题、需要人工判断
- ✅ 创建统一摘要格式，清晰展示检查结果与建议动作
- ✅ 集成到 package.json，支持 `pnpm validate:fix-first` 命令

### 验证结果
- 编排器正确识别了 3 项需要人工处理的问题（构建、运行时、AI 输出）
- AUTO-FIX / ASK 判定边界清晰可执行
- 门禁链路顺序与输出格式稳定

## 计划

1. 基于现有校验链路定义 Fix-First 分流规则。
2. 把门禁输出统一为可决策摘要格式。
3. 在至少一条真实交付链路中验证分流与门禁收口效果。

## 发布说明

本任务交付 Fix-First 流程与校验契约，为后续子任务提供标准化分流机制。

## 验收标准

- ✅ AUTO-FIX / ASK 判定边界清晰并可执行
- ✅ 门禁链路顺序与输出格式稳定
- ✅ 真实任务中人工往返次数可观察下降（通过减少低风险问题的往返）

## 风险

- 规则和实现脱节，导致"写了标准但没人执行" → 已通过可执行脚本解决
- 门禁输出信息密度过高，反而增加理解成本 → 已通过结构化摘要格式解决

## 状态

doing

## 更新痕迹

- 记忆：`memory/project/current-state.md`
- 索引：`scripts/ai/fix-first-orchestrator.js`, `package.json` (新增 validate:fix-first 命令)
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-021-fix-first-and-layered-gates.md`

## 一句复盘

通过 Fix-First 编排器将"该不该自动修复"从模糊判断升级为基于风险分层的明确决策，显著减少低风险问题的无效往返并提前暴露高风险问题。
