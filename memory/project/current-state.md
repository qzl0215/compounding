---
title: CURRENT_STATE
update_mode: manual
status: active
last_reviewed_at: 2026-04-07
source_of_truth: memory/project/current-state.md
related_docs:
  - AGENTS.md
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

- `t-099` 已完成 release 单一状态机：`kernel/release-state-machine.yaml` 与 `shared/release-state-machine.ts` 成为唯一 release 状态真相；`shared/release-registry.ts` 只做投影/修复；`scripts/release/*`、Studio、harness 与 project judgement 统一读 `state_id` / `state_label`。
- `t-098` 已完成：派生产物语义已统一为 `kernel/derived-asset-contract.yaml` 单一合同，`code_index / output / coordination / runtime` 四大家族的 truth role、可写性与回灌边界已明确；`pnpm ai:validate-derived-asset-contract` 与 `pnpm ai:validate-assets` 静态门禁已通过。
- `t-100` 已完成：目标层已统一为 `memory/project/goals.md` 单一主源，`roadmap.md`、`operating-blueprint.md`、`governance-gaps.md` 已删除。
- 本地 production 当前稳定运行在 `3010`；active release 以 `pnpm prod:status` 输出为准。
- `t-063` 已完成：`pnpm preflight` 已成为唯一对外推荐门禁，带 `taskId` 时会稳定进入完整 task guard。
- `t-058` 已完成：`scripts/ai` 的共享 CLI 外壳已经落地，`template-feedback`、`fix-first` 与 `create-task` 已收回同一套参数解析、标准输出、错误出口和 task 模板渲染。
- `t-059` 已完成：release registry、Studio 读模型和主源文档已经统一到真实待验收语义；已晋升到 prod 的旧 dev 不再继续显示为 `pending`。

## 当前阻塞

- 当前没有发布阻塞。
- 主要结构风险转到派生产物语义、feature context 第二轮和历史 task 最小兼容：如果 `code_index`、`output`、`agent-coordination` 和 runtime 事实继续各叫一套名字，执行链、展示层和 bootstrap 链会持续重复翻译；如果历史 task 的兼容派生继续散落在多处消费端，状态真相仍可能回流成新的兜底壳。

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
- `pnpm ai:generate-operator-assets`
- `pnpm ai:validate-operator-contract`
- `pnpm ai:validate-task-git`
- `pnpm ai:validate-governance-guards`
- `pnpm ai:retro-candidates`
- 确认 `docs/ARCHITECTURE.md` 的 core / bootstrap / config 清单已和当前仓真实目录对齐
- `pnpm prod:status`
- `pnpm prod:check`
- `pnpm ai:feature-context -- --surface=home`
- `pnpm ai:feature-context -- --route=/releases`
- 确认任务列表、首页摘要和 release 关联不再显示英文 task id 标题
- 确认首页、任务页、发布页继续只读同一份项目状态摘要
- 确认 `feature-context` 与 `build-context` 仍输出一致结构
- 确认 `pnpm preflight -- --taskId=t-xxx` 会带出 `retro_hints`
- 确认 24 小时后的 activity trace 会 compact 到 companion `iteration_digest`
- 确认治理类 task 声明的 `writeback_targets` 会在 `validate-task-git` 中命中对应 truth sink
- 确认治理守护矩阵 v1 仍只覆盖 `A4 / A6 / A7 / A9`，且 `validate:static` 已接入 `ai:validate-governance-guards`
- 继续收口派生产物的单一语义与 `SelectedChecks` 的默认入口
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
