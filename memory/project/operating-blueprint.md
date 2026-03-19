---
title: OPERATING_BLUEPRINT
doc_role: planning
update_mode: manual
owner_role: PMO
status: active
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/current-state.md
  - tasks/queue/task-025-multi-agent-coordination-init.md
last_reviewed_at: 2026-03-18
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

gstack 吸收对齐矩阵与引入边界（t-030）

## 关键子目标

### 子目标 1：产出唯一对齐矩阵

- 发布标准：
  - `memory/experience/gstack-alignment.md` 完整回答每项能力解决什么问题、当前是否已有、最小落点在哪里、为什么值得或不值得
  - 明确区分 `直接吸收 / 改造后吸收 / 明确不吸收`
- 关联任务：
  - `tasks/queue/task-030-gstack-alignment-and-adoption-boundary.md`

### 子目标 2：固定工作模式入口收口边界

- 发布标准：
  - `t-031` 已定义为只收口工作模式入口与 runbook
  - 不重写角色系统，不新增平行 UI
- 关联任务：
  - `tasks/queue/task-031-work-mode-entry-and-runbook.md`

### 子目标 3：固定差异感知 QA / Review / Retro 边界

- 发布标准：
  - `t-032` 只引入 diff-aware 检查建议与结构化产物
  - 不引入外部评估平台，不把所有改动升级为重回归
- 关联任务：
  - `tasks/queue/task-032-diff-aware-qa-review-retro.md`

### 子目标 4：固定预任务安全护栏边界

- 发布标准：
  - `t-033` 只补 pre-task gate、scope guard 与高风险决策收口
  - 不引入浏览器 daemon、Bun 原生运行时或 Claude 客户端绑定能力
- 关联任务：
  - `tasks/queue/task-033-pre-task-safety-guardrails.md`

## 当前阻塞

- 无结构性阻塞；核心风险在于若对齐矩阵写得不够硬，后续仍会把浏览器基础设施与流程门禁能力混在一起继续讨论。

## 下一检查点

- [ ] 产出 `memory/experience/gstack-alignment.md`
- [ ] 创建并对齐 `t-031`、`t-032`、`t-033`
- [ ] 用这份矩阵与用户确认下一轮只吸收流程、门禁和交付产物层能力

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
