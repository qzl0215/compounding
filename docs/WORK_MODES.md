---
title: WORK_MODES
update_mode: manual
status: active
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - memory/project/operating-blueprint.md
  - memory/project/roadmap.md
last_reviewed_at: 2026-03-24
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 工作模式

## 总原则

- 先判断需求处在哪个场景，再决定是否进入某个 mode。
- 工作模式只描述场景、输入、允许动作和退出条件，不承载角色说明、runbook 或发布细节。
- 事情仍处于 `待思考 / 待规划` 时，不得直接切到工程执行。

## 总链

`需求提出 → 战略澄清 → 方案评审 → 工程执行 → 质量验收 → 发布复盘`

## 战略澄清

- 场景：方向、问题定义、成功标准或发布标准还不清晰。
- 输入：新需求或新问题、当前 `roadmap`、当前 `operating-blueprint`、当前阻塞。
- 允许动作：扩选项、澄清问题、补齐战略边界、决定是否形成规划 task。
- 退出条件：形成可执行 plan，或明确暂不做 / 不做。

## 方案评审

- 场景：目标已经成立，但边界、取舍、范围外或验收标准未收口。
- 输入：已澄清的目标、候选方案、验收需求、相关模块上下文。
- 允许动作：收关键决策、明确范围内外、写清完成定义、决定是否进入 task。
- 退出条件：task 已可执行，验收标准与约束已明确。

## 工程执行

- 场景：task 合同已经明确，边界和验收标准已定。
- 输入：已确认的 task、`current-state`、相关模块上下文、必要的 `code_index/*`。
- 允许动作：实现、重构、最小验证、task / memory / index 回写。
- 退出条件：结果达到可验收状态，且相关回写已完成。

## 质量验收

- 场景：工程执行已完成，结果准备交给人或运行时判断。
- 输入：已实现结果、完成定义、运行时和测试结果、设计要求。
- 允许动作：给出通过 / 不通过结论、记录风险和补救动作。
- 退出条件：验收结论明确；通过后才能进入发布复盘。

## 发布复盘

- 场景：验收已通过，或需要以 release 为边界进行回滚。
- 输入：已通过验收的结果、release 准备结果、运行态状态、风险说明。
- 允许动作：合并 `main`、切换 release、回滚、写入复盘与经验。
- 退出条件：版本切换或回滚完成，复盘已落地。

<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
