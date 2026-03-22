---
title: CURRENT_STATE
doc_role: memory
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-22
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
- `t-038` 已完成并发布，短编号唯一性、任务/发布显式绑定、首页假状态与 live 文档空壳规则已完成一轮收口。
- `t-040` 已启动，当前主线改为“需求环节总图与启发式对话入口”：先显式区分待思考、待规划、待执行、执行中和待验收，再决定是否进入 task。
- 当前阶段不扩 orchestration UI、数据库或新运行时；先把人和 AI 的对话节奏、页面认知顺序和 task 边界对齐。

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
- `pnpm preview:check`
- `pnpm prod:check`
- `pnpm coord:check:pre-task`
- 验证首页、任务页、知识库、发布页是否都按同一套需求环节模型投影
- 验证规划类事项没有误进待执行 task
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
