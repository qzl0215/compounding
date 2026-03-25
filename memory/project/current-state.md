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

- `t-066` 进行中：把高频模块补成可机读 feature 合同，并让 `scripts/ai/feature-context.ts`、`build-context.ts`、首页 / 任务页 / 发布页都开始读取共享项目状态摘要。
- 当前主线是 AI feature 开发提效：先减少首轮搜索和二次返工，再继续压 release 单一状态机与 preflight 单入口。
- 本地 production 当前稳定运行在 `3010`；active release 以 `pnpm prod:status` 输出为准，当前主线仍运行正常。
- `t-064` 已完成：首页已改成面向人的项目逻辑态势图，主视觉是可点击的逻辑结构图，只保留目标、里程碑、节奏、风险和下钻入口。
- `t-058` 已完成：`scripts/ai` 的共享 CLI 外壳已经落地，`template-feedback`、`fix-first` 与 `create-task` 已收回同一套参数解析、标准输出、错误出口和 task 模板渲染。
- `t-059` 已完成：release registry、Studio 读模型和主源文档已经统一到真实待验收语义；已晋升到 prod 的旧 dev 不再继续显示为 `pending`。
- `t-063` 仍在待续主线：统一 preflight 入口，把 `pnpm preflight` 收成唯一对外推荐门禁，并让 task guard 不再依赖当前 diff 是否已进入 structural。

## 当前阻塞

- 当前没有发布阻塞。
- 主要结构风险转到 feature context、共享状态摘要和选测闭环如果继续各自维护一份本地翻译，AI 加功能时仍会回到手工拼上下文。

## 当前推荐校验顺序

- 改动前门禁：`pnpm preflight`；`structural / release` task 用 `pnpm preflight -- --taskId=t-xxx`
- 静态门禁：`pnpm validate:static`
- 构建门禁：`pnpm validate:build`
- 运行时门禁：
  - `pnpm preview:check`
  - `pnpm prod:check`
- AI 输出门禁：`pnpm validate:ai-output`（仅在 prompt / AI 重构链路变动时进入）
- 多 Agent 协调兼容入口：`pnpm coord:check:pre-task`（仅兼容旧调用方，不再作为主入口说明）

## 关键冻结项

- 不恢复旧 workflow 前台和重型多步骤表单
- 不把 task 演化成审批流或重型工单系统
- 不新增平行读模型或后台数据库
- 不以一次大改替代批次推进与逐步验收

## 下一检查点

- `pnpm preflight`
- `pnpm preflight -- --taskId=t-066`
- `pnpm preflight -- --taskId=t-063`
- `pnpm validate:static`
- `pnpm validate:build`
- `pnpm preview:status`
- `pnpm preview:check`
- `pnpm prod:status`
- `pnpm prod:check`
- `pnpm ai:feature-context -- --surface=home`
- `pnpm ai:feature-context -- --route=/releases`
- 确认首页、任务页、发布页继续读同一份项目状态摘要
- 确认 feature context 能在无 task / 有 task 两条路径输出一致结构
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
