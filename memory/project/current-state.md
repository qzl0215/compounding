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
- `t-042 ~ t-051` 已把单层 plan、task 执行合同、最小 companion / release、模板单点化、高频文档主干和 `AGENTS` 执行入口收回主线。
- 当前运营重点切到下一轮高 ROI 收口候选评估：优先看 `scripts/ai` 重复编排逻辑、兼容层残留和仍会放大默认读链的静态噪音。
- 当前阶段不扩新页面、新状态源、新运行时或新治理文档；继续只做减默认必读面、减重复解释、减错读主源。

## 当前阻塞

- `AGENTS` 已完成瘦身，当前阻塞不再是文档骨架，而是脚本层和兼容层里仍可能残留重复编排逻辑。
- 如果 `scripts/ai` 继续各自维护参数解析、模板填充和失败出口，后续自动化会继续重复造轮子。
- 如果 portal / task / release 的兼容壳不继续退出主读链，文档瘦身的收益会被模型层膨胀抵消。

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
- 评估 `scripts/ai` 的重复编排逻辑是否值得进入下一轮高 ROI 收口
- 评估 portal / task / release 兼容层是否还有可安全拔掉的旧别名和回退壳
- 继续验证 `README`、`build-context` 与 `ai-rewrite-context` 没有把附录重新拉回默认第一跳
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
