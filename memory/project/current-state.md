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
- `t-050` 已把高频阅读面收成 4 文档主干 + 3 状态主源；当前运营重点切到 `t-051`：把 `AGENTS` 激进瘦身成真正的一屏执行入口。
- 当前阶段不扩新页面、新状态源、新运行时或新治理文档；继续只做减默认必读面、减重复解释、减错读主源。

## 当前阻塞

- 如果 `AGENTS` 继续混入 runbook、专项治理和运行事实，它仍然不是一屏内的执行入口。
- 如果迁出的内容没有在 `AI_OPERATING_MODEL / DEV_WORKFLOW / PROJECT_RULES / current-state` 中各归其位，瘦身会演变成信息缺口。
- 如果上下文构建和知识库入口继续把附录与主干混读，默认读链仍会被拖宽。

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
- 验证 `t-051` 是否真的把 `AGENTS` 收成执行原则、默认读链与最小门禁
- 验证被移出的 runbook、AI 行为、专项治理和运行事实是否各自落在正确主源
- 验证 `README`、`build-context` 与 `ai-rewrite-context` 是否没有重新把附录拉回默认第一跳
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
