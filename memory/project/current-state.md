---
title: CURRENT_STATE
update_mode: manual
status: active
last_reviewed_at: 2026-03-24
source_of_truth: memory/project/current-state.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/operating-blueprint.md
  - docs/DEV_WORKFLOW.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 当前状态

## 本地入口

- 本地生产默认端口：`3010`
- dev 预览默认端口：`3011`
- `main` 已更新不等于本地生产自动在线；需要手动拉起本地常驻进程
- 本地生产是否真正生效，以 `pnpm prod:status` 与 `pnpm prod:check` 为准
- 运行边界：`server-only`

## 当前焦点

- 本地 production 当前稳定运行在 `3010`；当前 active release 仍以 `pnpm prod:status` 输出为准。
- `t-052` 正在把 planning 从对象层收回为阶段动作：需求不清时默认回到 `operating-blueprint`，task 只保留可执行事项。
- 当前正在同时收口三处回流口：`AGENTS / WORK_MODES / DEV_WORKFLOW` 的 planning 语义、portal planning stage 来源、task 默认 currentMode。
- 当前阶段不扩新页面、新状态源、新运行时或新治理文档；继续只做减对象类别、减默认必读面、减错读主源。

## 当前阻塞

- 主要风险不是计划主源本身，而是 planning 语义仍可能从 task 默认 mode、portal stage 投影和旧文案回流。
- 如果 `todo` task 继续默认落到 `方案评审`，即使文档收口了，任务页和首页仍会把 planning 错读成 task 对象。
- 如果大 task 的剩余范围不明确退回 plan，后续很容易重新长出 task 树或隐性“规划 task”。

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
- 验证 planning 只来自 `operating-blueprint`，`/tasks` 不再承担待规划对象展示
- 验证新建或默认 task 不再落到 `战略澄清 / 方案评审`
- 确认大 task 的剩余范围回到 plan，而不是继续在 task 内树化
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
