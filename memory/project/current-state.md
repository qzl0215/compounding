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
- `t-042 ~ t-049` 已把单层 plan、task 执行合同、最小 companion / release、模板单点化与规则去重收回主线。
- 当前运营重点切到 `t-050`：把高频阅读面收成 4 文档主干 + 3 状态主源，并同步默认读链与消费方。
- 当前阶段不扩新页面、新状态源、新运行时或新治理文档；继续只做减默认必读面、减重复解释、减错读主源。

## 当前阻塞

- 如果 `AGENTS` 继续同时承接硬规则、读链、回复契约和门禁，高频入口仍会有粗细不一的问题。
- 如果 `current-state` 和 `operating-blueprint` 继续混运营快照与计划内容，消费方仍会读错主源。
- 如果 `README`、`build-context` 与 `ai-rewrite-context` 不跟着新骨架同步，高频文档收口只会停留在正文层。

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
- 验证 `t-050` 是否真的把高频阅读面收成 4 文档主干 + 3 状态主源
- 验证 `AGENTS` 是否只剩硬规则、默认读链和改动门禁
- 验证 `current-state` 是否不再承载愿景、价值观和长期叙事
- 验证 `operating-blueprint` 是否不再承载当前阻塞和下一检查点
- 验证 `README`、`build-context` 与 `ai-rewrite-context` 是否按新骨架读取主源
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
