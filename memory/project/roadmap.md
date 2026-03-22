---
title: ROADMAP
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-22
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - memory/project/operating-blueprint.md
  - docs/WORK_MODES.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 路线图

## 当前阶段

Stage-First Project Visualization（需求环节总图推进中）

## 下个里程碑

需求环节总图与启发式对话入口

## 里程碑成功标准

- 首页、任务页、知识库、发布页都按同一套需求环节模型展示
- `待思考 / 待规划 / 待执行 / 执行中 / 待验收 / 已发布` 的映射规则明确且稳定
- `task` 继续只承接可执行事项，不承接模糊想法
- 首页和任务页不再出现 live 事实漂移

## 当前优先级

把项目总览升级为“需求环节总图”，让人和 AI 都先判断这件事是待思考、待规划还是可执行，再决定是否进入 task 和工程执行。

## 下一阶段方向

- 把首页从“看状态”升级为“先看需求成熟度，再看运行与执行”
- 把 AI 对话契约显式化：待思考先启发式追问，待规划先共商边界，待执行才进入 task
- 把任务页、知识库、发布页都收口到同一套 stage-first 认知顺序

## 待规划

- 首页五区块与对话提示的人话表达要进一步打磨，避免重新长回机器语言
- 规划类 task 与执行类 task 的长期治理边界，需要继续用真实任务验证
- 需求环节模型后续是否要接入更多自动提醒，只能在保持轻量的前提下推进

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
- [x] 完成 `t-037`：运营后台首页内容简化为决策板并收口首屏信息
- [x] 完成 `t-038`：收口短编号、规则层、当前状态与 cockpit 冗余
- [x] 明确下一阶段主线任务及其范围边界
- [ ] 推进 `t-040`：需求环节总图与启发式对话入口
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
