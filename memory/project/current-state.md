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
- 当前焦点切到 `t-058`：收紧 `scripts/ai` 的重复编排逻辑，只抽公共 CLI 外壳，不改业务策略，不碰 portal。
- 这轮目标是统一 `template-feedback`、`fix-first` 与 `create-task` 的参数解析、标准输出、错误出口和 task 模板渲染，减少脚本层重复而不引入新框架。
- 当前阶段不扩新页面、新状态源、新运行时系统或远端部署模型；优先继续收真正会制造维护成本的脚本边界。

## 当前阻塞

- 主要风险不再是 runtime cwd，而是 `scripts/ai` 里的 CLI 外壳逻辑仍分散在多个脚本里，后续每次加门禁或模板约定都要多处同步。
- 如果共享内核抽取过度，会把业务策略和公共外壳重新耦成一个新框架；如果抽取不足，重复代码会继续增长。

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
- `python3 scripts/init_project_compounding.py attach --target . --config bootstrap/project_brief.yaml`
- `python3 scripts/init_project_compounding.py proposal --target . --config bootstrap/project_brief.yaml`
- 确认当前无 `pending dev`，本地 production 继续稳定运行在最新 active release
- 验证 `template-feedback-orchestrator`、`fix-first-orchestrator`、`create-task` 继续保持现有 CLI 行为
- 验证共享内核只承接参数解析、输出、错误出口和 task 模板渲染，不承接业务判断
- 验证 `pnpm lint`、`pnpm test`、`pnpm build`、`validate-change-trace`、`validate-task-git-link` 全部通过
- 刷新代码量快照，确认 `scripts/ai` 的增长得到收敛
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
