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

- `t-064` 正在推进：把首页改成面向人的项目逻辑态势图，主视觉改成可点击的逻辑结构图，只保留目标、里程碑、节奏、风险和下钻入口。
- 本地 production 当前稳定运行在 `3010`；active release 仍以 `pnpm prod:status` 输出为准。
- `t-053` 已完成：本地 production 已脱离 release worktree 运行 cwd，当前只保留主工作区，不再保留 release worktree 作为常驻运行目录。
- `t-058` 已完成：`scripts/ai` 的共享 CLI 外壳已经落地，`template-feedback`、`fix-first` 与 `create-task` 已收回同一套参数解析、标准输出、错误出口和 task 模板渲染。
- `t-059` 已完成：release registry、Studio 读模型和主源文档已经统一到真实待验收语义；已晋升到 prod 的旧 dev 不再继续显示为 `pending`。
- `t-061` 已完成：portal 读模型聚合层已拆成薄 barrel，`builders.ts` 不再承担首页摘要、Kernel/Project snapshot 与运行态翻译的全部职责。
- `t-062` 已完成：portal 首页 shell 已拆成更薄入口，Kernel / Project 面板不再堆在单文件里。
- 当前 active release 以 `pnpm prod:status` 输出为准；本地 runtime release 目录也已脱离 git worktree，当前 `git worktree list` 只剩主工作区。
- `t-063` 仍在待续主线：统一 preflight 入口，把 `pnpm preflight` 收成唯一对外推荐门禁，并让 task guard 不再依赖当前 diff 是否已进入 structural。

## 当前阻塞

- 当前没有发布阻塞；主要结构风险转到首页如果继续沿用旧 `Kernel / Project` 壳，会让人类阅读继续被工程对象拖累。
- 如果首页逻辑图只换视觉、不切读模型，旧 tab、旧 kernel 壳和旧文案很快会重新回流。

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
- `pnpm preflight -- --taskId=t-064`
- `pnpm validate:static`
- `pnpm validate:build`
- `pnpm preview:status`
- `pnpm preview:check`
- `pnpm prod:status`
- `pnpm prod:check`
- 确认首页首屏不再出现 `Kernel / Project` tab、artifact health、boundary groups 和常驻 runtime 状态板
- 确认五个逻辑节点都能打开对应文档或页面
- 确认健康态只显示轻量结论，待验收或运行异常时才升格提醒
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
