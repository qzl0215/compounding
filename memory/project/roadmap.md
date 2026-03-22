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

Autonomous Multi-Agent Delivery Framework（Phase 2：AI 自主系统反熵收敛）

## 下个里程碑

AI 自主系统反熵收敛：短编号唯一、规则层瘦身与 cockpit 真相继续收口

## 里程碑成功标准

- 所有 queue task 都显式填写且全局唯一的短编号；release、resolver 与 UI 不再出现 task 身份歧义
- `current-state` 只保留运营快照；当前计划、当前优先级与执行待办只在 `roadmap` 中维护
- live 文档、AI preamble 与 bootstrap 渲染器不再重复空洞证据边界或多份沟通契约
- 首页 cockpit 只保留已消费的决策字段，不再维护旧证据网格、假冲突卡或位置耦合语义
- 这轮收口不新增新的持久化真相源，也不扩 orchestration UI、数据库或新运行时

## 当前优先级

完成 `t-038`：修复短编号歧义、删除 live 文档空壳规则、继续收口 `current-state` 与 cockpit 残余冗余，让 AI 自主链路继续减熵。

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
- [ ] 完成 `t-038`：收口短编号、规则层、当前状态与 cockpit 冗余
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
