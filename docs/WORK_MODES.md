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
last_reviewed_at: 2026-03-27
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 工作模式

## 总原则

- mode 只有 `planning / execution / review / release` 四种，统一由任务状态机驱动。
- mode 只定义最小上下文包、输入输出契约和允许动作；具体事件、guard 与命令放在 `docs/DEV_WORKFLOW.md`。
- 未达到可执行边界前，不得进入 task execution；仍模糊的事项继续留在 `memory/project/operating-blueprint.md`。

## 总链

`idea -> planning -> execution -> review -> release`

## planning

- 场景：需求已值得推进，但边界、成功标准、约束或交付轨道还未收口。
- 最小输入：task 合同草案、`memory/project/roadmap.md`、`memory/project/operating-blueprint.md`、`memory/project/current-state.md`、必要模块上下文。
- 输出契约：边界、完成定义、范围外、约束、测试策略、`delivery_track`。
- 允许动作：收口合同、定轨道、补最小 search evidence、决定是否继续留在 plan。
- 退出条件：进入 `ready`，可以交给 execution。

## execution

- 场景：task 已 ready，preflight 通过，可以开始实现。
- 最小输入：已收口 task 合同、`memory/project/current-state.md`、相关模块/索引、retro hints、必要 search evidence。
- 输出契约：实现改动、handoff、必要 search evidence、最小验证结果。
- 允许动作：编码、重构、修护栏、补 companion artifacts、准备 handoff。
- 退出条件：进入 `review_pending`。

## review

- 场景：execution 已交接，需要给出 merge/release 判断。
- 最小输入：task 合同、diff summary、scope/architecture/test 结果。
- 输出契约：merge decision、review note、是否进入 release。
- 允许动作：启动 review、拒绝、要求回到 execution、确认通过。
- 退出条件：`direct_merge` 直接收口到 released，或 `preview_release` 进入 release。

## release

- 场景：review 已通过，且任务交付轨道要求 release 编排，或者需要 rollback。
- 最小输入：review 结果、`delivery_track`、operator/runtime/release facts。
- 输出契约：preview、accept/reject、prod promote、rollback 结果。
- 允许动作：prepare preview、accept/reject、promote main、rollback、记录 release facts。
- 退出条件：进入 `released` 或 `rolled_back`。

<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
