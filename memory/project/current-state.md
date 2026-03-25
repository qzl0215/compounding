---
title: CURRENT_STATE
update_mode: manual
status: active
last_reviewed_at: 2026-03-27
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

- `t-066` 已完成并进入 production：高频模块已补成可机读 feature 合同，`scripts/ai/feature-context.ts` 与 `build-context.ts` 已能直接提供 feature 包，首页 / 任务页 / 发布页也已开始读取共享项目状态摘要。
- `t-067` 已完成并落到 `main`：task 标题已经统一成中文直给概述，`create-task` 会拦截英文标题摘要，历史 `任务 task-xxx` 机器壳标题也会自动回退到中文摘要。
- 当前主线转到“派生产物语义收口”：继续把 `code_index/*`、`output/*`、coordination 产物和 runtime 事实压成一致的“主源 / 派生物”心智，减少导航缓存、执行产物和展示投影各自长解释层。
- 本地 production 当前稳定运行在 `3010`；active release 以 `pnpm prod:status` 输出为准，当前 active release 已切到 `t-066` 上线版本。
- `t-064` 已完成：首页已改成面向人的项目逻辑态势图，主视觉是可点击的逻辑结构图，只保留目标、里程碑、节奏、风险和下钻入口。
- `t-058` 已完成：`scripts/ai` 的共享 CLI 外壳已经落地，`template-feedback`、`fix-first` 与 `create-task` 已收回同一套参数解析、标准输出、错误出口和 task 模板渲染。
- `t-059` 已完成：release registry、Studio 读模型和主源文档已经统一到真实待验收语义；已晋升到 prod 的旧 dev 不再继续显示为 `pending`。
- `t-063` 已完成：`pnpm preflight` 已成为唯一对外推荐门禁，带 `taskId` 时会稳定进入完整 task guard。

## 当前阻塞

- 当前没有发布阻塞。
- 主要结构风险转到派生产物语义与 feature context 第二轮：如果 `code_index`、`output`、coordination 产物和 runtime 事实继续各叫一套名字，执行链、展示层和 bootstrap 链会持续重复翻译；如果 `build-context`、`feature-context`、模块合同和 `SelectedChecks` 后续再次各自维护一套本地规则，AI 加功能时仍会回到手工拼上下文。

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
- `pnpm preflight -- --taskId=t-xxx`
- `node --experimental-strip-types scripts/ai/create-task.ts task-xxx "中文直给概述" "为什么现在"`
- `pnpm validate:static`
- `pnpm validate:build`
- `pnpm prod:status`
- `pnpm prod:check`
- `pnpm ai:feature-context -- --surface=home`
- `pnpm ai:feature-context -- --route=/releases`
- 确认任务列表、首页摘要和 release 关联不再显示英文 task id 标题
- 确认首页、任务页、发布页继续只读同一份项目状态摘要
- 确认 `feature-context` 与 `build-context` 仍输出一致结构
- 继续收口派生产物的单一语义与 `SelectedChecks` 的默认入口
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
