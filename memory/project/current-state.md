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

- 本地 production 当前稳定运行在 `3010`；当前 active release 仍以 `pnpm prod:status` 输出为准。
- `t-053` 正在把本地 production 从 release worktree 运行 cwd 中解耦：active prod 先 materialize 到固定 runtime 副本，再由本地生产进程从该副本启动。
- 当前目标是让 release worktree 只承担构建与切换输入，不再承担本地 production 常驻运行目录。
- `t-054` 已补上 `single-kernel + project-shell` 的 MVP 闭环：当前仓库可作为老项目跑通 `attach / audit / proposal`，空目录可跑最小 `bootstrap`，`apply-proposal` 只自动处理 `auto_apply` 协议资产。
- `t-054` 已用第二个老项目 `qianfamily` 完成真实验证：`bootstrap/project_brief.yaml` 已生成并落分支，缺失协议资产已通过 kernel proposal `auto_apply` 补齐，`qianfamily` 的 `audit / typecheck / build` 均已通过。
- 当前阶段不扩新页面、新状态源、新运行时系统或远端部署模型；继续只做 release/runtime 边界收口。

## 当前阻塞

- 主要风险不是发布台账，而是本地 production 一旦仍从 release worktree 启动，就无法真正把 worktree 清到只剩主工作区。
- 如果 `current` 软链、runtime 状态和实际 `cwd` 没一起切到固定 runtime 副本，`prod:status` 虽然可能显示健康，release worktree 依赖仍会潜伏。
- 如果 rollback 沿用旧路径，只修 accept/switch，不修 rollback，runtime cwd 仍会在回滚时重新回流到 release worktree。

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
- 验证 `local-prod.json` 的 `cwd` 已切到 `.compounding-runtime/live/prod/*`
- 验证 `git worktree list` 只剩主工作区
- 验证 kernel proposal 的 `auto_apply` 只覆盖协议层资产，不会覆盖 `apps/**`、`scripts/release/**`、`scripts/local-runtime/**`
- 验证 rollback 也复用同一条 runtime materialize 路径，不再回流到 release worktree
- 在 `t-053` 收口后，抽样检查高频主干文档 freshness warning 与 cleanup candidate 输出是否仍保持轻量、可解释且不形成新状态源
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
