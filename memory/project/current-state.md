---
title: CURRENT_STATE
update_mode: manual
status: active
last_reviewed_at: 2026-04-06
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
- `t-068` 已完成：`structural / release` task 现在会自动记录 preflight / handoff / review / release / rollback 的阶段 activity；24 小时后 raw trace 会 compact 进 companion `iteration_digest`，`pnpm preflight -- --taskId=t-xxx` 会直接带出 retro hints，重复 blocker 可用 `pnpm ai:retro-candidates` 聚合成候选。
- `t-069` 已完成：服务器访问面、GitHub 接入方式和标准发布流已经统一进 `bootstrap/project_operator.yaml`；`docs/OPERATOR_RUNBOOK.md` 与 Claude/Cursor/OpenCode 薄入口可脚本生成并在静态门禁中校验，不再各自复制一套接入说明。
- `t-095` 已完成治理控制面的回写闭环 v1：治理类 task 现在必须声明 `writeback_targets`，且 `validate-task-git` 会对 `Current / Code Index / Tests` 做文件级兑现校验；`Controlled Facts` 仍保留但未启用，task 正文、patch note 与 retro 不能替代 truth 回写。
- `t-096` 已完成治理守护优先 v1：`memory/project/operating-blueprint.md` 已收口治理守护矩阵，`pnpm ai:validate-governance-guards` 会校验 `A4 / A6 / A7 / A9` 的 guard 注册表、脚本入口和 `validate:static` 接入漂移，治理面现在可以回答 `assertion -> guard`。
- `t-097` 已完成 `A5 / GOV-GAP-02` 收口：active/未来 task 的状态读写链只认 `kernel/task-state-machine.yaml` 与 companion `machine.*`；`current_mode` 已退出 companion/CLI/Studio/validator，task prose `状态` 只保留人类展示。
- `t-098` 正在收口派生产物语义主合同：`kernel/derived-asset-contract.yaml` 作为唯一机器合同，统一 `code_index / output / agent-coordination / .compounding-runtime` 的 truth role、可写性与回灌边界。
- `t-098` 的兼容修正已经补上：task 正文里的 `状态（派生展示）` 仍可被 task parser 识别，避免 branch backfill / branch cleanup 因模板文案变化误判 task 为 `todo`。
- 当前需要先把仓内文件族明确成 core / bootstrap / config / 治理主源 四层清单，并继续把 `code_index/*`、`output/*`、`agent-coordination/*` 和 `.compounding-runtime/*` 收进主源 / 派生物两层心智；这会直接影响跨页面唯一 snapshot 与 release 单一状态机的收口。
- 当前主线回到“派生产物语义收口”：继续把 `kernel/derived-asset-contract.yaml` 固化成唯一机器合同，让 `code_index/*`、`output/*`、`agent-coordination/*` 和 `.compounding-runtime/*` 压成一致的“主源 / 派生物”心智，减少导航缓存、执行产物和展示投影各自长解释层。
- 本地 production 当前稳定运行在 `3010`；active release 以 `pnpm prod:status` 输出为准，当前 active release 已切到 `t-066` 上线版本。
- `t-064` 已完成：首页已改成面向人的项目逻辑态势图，主视觉是可点击的逻辑结构图，只保留目标、里程碑、节奏、风险和下钻入口。
- `t-058` 已完成：`scripts/ai` 的共享 CLI 外壳已经落地，`template-feedback`、`fix-first` 与 `create-task` 已收回同一套参数解析、标准输出、错误出口和 task 模板渲染。
- `t-059` 已完成：release registry、Studio 读模型和主源文档已经统一到真实待验收语义；已晋升到 prod 的旧 dev 不再继续显示为 `pending`。
- `t-063` 已完成：`pnpm preflight` 已成为唯一对外推荐门禁，带 `taskId` 时会稳定进入完整 task guard。

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
