---
title: CURRENT_STATE
doc_role: memory
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-23
source_of_truth: memory/project/current-state.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/operating-blueprint.md
  - docs/DEV_WORKFLOW.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 当前状态

## 项目概览

- 项目名称：Compounding AI Operating System
- 战略真相请看 `memory/project/roadmap.md`
- 这里仅记录当前运营快照、冻结项和运行边界

## 使命与愿景

- 使命：把当前仓库升级成适合 AI 长期协作、任务驱动、可持续重构与自进化的 AI-Native Repo。
- 愿景：让这个项目既像创业团队一样高效推进，又能把经验、结构和发布能力持续沉淀成复利系统。

## 核心价值观

- 规则服务于效率，不服务于扩张
- 持续抓重点，不过度优化
- 少条条框框，但井井有条

## 本地入口

- 本地生产默认端口：`3010`
- dev 预览默认端口：`3011`
- `main` 已更新不等于本地生产自动在线；需要手动拉起本地常驻进程

## 运行边界

- server-only

## 当前焦点

- 本地 production 当前稳定运行在 `3010`；`main` 已发布，但常驻进程仍需要人工确认是否在线。
- `t-042` 已完成并发布到 `main / production`；Plan / Task / Companion / Release 的最简边界已进入生产主线。
- `t-043` 已完成 gstack ROI 吸收刷新；新的高 ROI 执行主线已固定为 `t-044 ~ t-046`。
- `t-044` 已完成并进入 `main / production`；Search Before Building 与 Boil the Lake 已落到 AI 行为链、task 边界与 companion 机器事实。
- 当前运营重点切到 `t-049`：收口 AGENTS、AI_OPERATING_MODEL 与 DEV_WORKFLOW 的重复语义，先让规则文档职责单一。
- `t-045` 与 `t-046` 继续保留为下一批高 ROI 吸收项，但先让模板单点化落地，避免后续再在多处同步 task 合同骨架。
- `t-047` 已完成并发布，任务页已收成单一子任务表格。
- `t-048` 已完成并发布；task 合同模板已收口成唯一可渲染来源。
- 当前阶段不扩 orchestration UI、数据库或新运行时；继续只吸收轻流程、轻门禁、轻测试治理思想，并开始清理规则文档重复。

## 当前推荐校验顺序

- 静态门禁：`pnpm validate:static`
- 构建门禁：`pnpm validate:build`
- 运行时门禁：
  - `pnpm preview:check`
  - `pnpm prod:check`
- AI 输出门禁：`pnpm validate:ai-output`（仅在 prompt / AI 重构链路变动时进入）
- 多 Agent 协调：`pnpm coord:check:pre-task`（在 task 变更前执行）

## 关键冻结项

- 不恢复旧 workflow 前台和重型多步骤表单
- 不把 task 演化成审批流或重型工单系统
- 不新增平行读模型或后台数据库
- 不以一次大改替代批次推进与逐步验收

## 下一检查点

- `pnpm validate:static`
- `pnpm validate:build`
- `pnpm prod:check`
- `pnpm coord:check:pre-task`
- 确认当前无 `pending dev`，本地 production 继续稳定运行在最新 active release
- 验证 `t-049` 是否真的把 AGENTS、AI_OPERATING_MODEL 与 DEV_WORKFLOW 的重复语义收口；各文档不再解释同一件事两遍
- 验证 `t-048` 是否真的把 task 合同模板收口成单点真相；改模板时不再需要同时改 `create-task`、测试夹具和反馈脚本
- 验证 `t-043` 产出的 `t-044 ~ t-046` 边界是否足够清楚，不会再次长成大而散 backlog
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
