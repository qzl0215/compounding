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
- `t-059` 已完成：release registry、Studio 读模型和主源文档已经统一到真实待验收语义；已晋升到 prod 的旧 dev 不再继续显示为 `pending`。
- `t-061` 已完成：portal 读模型聚合层已拆成薄 barrel，`builders.ts` 不再承担首页摘要、Kernel/Project snapshot 与运行态翻译的全部职责。
- `t-062` 已完成：portal 首页 shell 已拆成更薄入口，Kernel / Project 面板不再堆在单文件里。
- 当前 active release 以 `pnpm prod:status` 输出为准；本地 runtime release 目录也已脱离 git worktree，当前 `git worktree list` 只剩主工作区。
- 当前主线切到 `t-063`：统一 preflight 入口，把 `pnpm preflight` 收成唯一对外推荐门禁，并让 task guard 不再依赖当前 diff 是否已进入 structural。

## 当前阻塞

- 当前没有发布阻塞；主要结构风险转到动手前门禁仍存在双入口心智，以及 task guard 依赖当前 diff 的误判。
- 如果继续同时暴露 `python3 scripts/pre_mutation_check.py`、`pnpm preflight` 与 `pnpm coord:check:pre-task`，后续脚本和人工执行都会继续分叉。

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
- `pnpm preflight -- --taskId=t-063`
- `pnpm validate:static`
- `pnpm validate:build`
- `pnpm prod:status`
- `pnpm prod:check`
- `pnpm coord:check:pre-task -- --taskId=t-063`
- `pnpm ai:validate-assets`
- `pnpm ai:cleanup-candidates`
- 确认当前无 `pending dev`，本地 production 继续稳定运行在最新 active release
- 确认统一 preflight 入口后，`coord:task:start`、兼容别名和基础 gate 输出 contract 没有漂移
- 确认 `latest_pre_mutation_check.json` 继续被稳定写出，`git-health` 消费口径不回退
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
