---
title: CURRENT_STATE
update_mode: manual
status: active
last_reviewed_at: 2026-03-25
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

- 本地 production 当前稳定运行在 `3010`；active release 仍以 `pnpm prod:status` 输出为准。
- `t-053` 已完成：本地 production 已脱离 release worktree 运行 cwd，当前只保留主工作区，不再保留 release worktree 作为常驻运行目录。
- `t-058` 已完成：`scripts/ai` 的共享 CLI 外壳已经落地，`template-feedback`、`fix-first` 与 `create-task` 已收回同一套参数解析、标准输出、错误出口和 task 模板渲染。
- 当前无 `pending dev`；本地 production 已稳定运行在 `20260324195439-38bfa9d-prod`。
- 当前主线回到结构 review 待定状态；下一轮优先只选一个高 ROI 边界继续推进，候选仍以 portal 读模型聚合点与 release 兼容壳为主。

## 当前阻塞

- 当前没有发布阻塞；主要剩余结构风险是 portal 读模型仍偏聚合、release 兼容壳仍有历史回退逻辑，下一轮需要只挑一个边界继续收口。
- 如果下一轮同时动多个结构边界，会重新放大对象歧义和回归成本。

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
- `pnpm ai:validate-assets`
- `pnpm ai:cleanup-candidates`
- 确认当前无 `pending dev`，本地 production 继续稳定运行在最新 active release
- 为下一轮结构收口先明确单一候选边界，再进入新的执行 task
- 在下一轮动手前刷新代码量快照，并重新评估高 ROI 噪音入口
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
