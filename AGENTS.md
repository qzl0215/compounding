---
title: AGENTS
doc_role: source
update_mode: manual
owner_role: Foreman
status: active
source_of_truth: AGENTS.md
related_docs:
  - docs/PROJECT_RULES.md
  - docs/ARCHITECTURE.md
  - docs/DEV_WORKFLOW.md
  - docs/AI_OPERATING_MODEL.md
  - memory/project/current-state.md
  - memory/project/roadmap.md
last_reviewed_at: 2026-03-15
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
## Hard Rules

- `AGENTS.md` 是仓库内唯一高频执行主源；长文规则落在 `docs/*`，状态和经验落在 `memory/*`。
- 默认先做只读盘点，再做最小可验证改动。
- 默认先做高 ROI 动作，不做过度工程和抽象炫技。
- 任何结构性改动都必须绑定任务、更新相关记忆，并在进入 `main` 前完成 review。
- 巨型 util / helper / common 不允许继续扩张；新增逻辑必须伴随清理或明确删除计划。
- 经验先写入 `memory/experience/*`，稳定后再升格到 `docs/*` 或 `AGENTS.md`。
- 生产发布只认 `main`；回滚通过 release 切换完成，不通过 `git reset` 改写线上状态。

## Current State

- 项目名称：Compounding AI Operating System
- 项目一句话：把当前仓库升级成适合 AI 长期协作、任务驱动、可持续重构与自进化的 AI-Native Repo。
- 当前优先级：切到 main 直发生产，并补齐最小影响发布、回滚和本机管理入口。
- 成功定义：生产构建样式稳定，main 可直接发布；新版本先在后台 release 目录完成构建与检查，再通过 current 软链秒级切换；一旦改坏，可在本机或内网管理页 review 最近版本并快速回滚。
- 必须保护：AGENTS.md 是唯一主源，Git 文件即真相，关键改动先 review 再写入，不引入平行规则体系，发布失败不影响当前线上版本
- 运行边界：server-only
- 当前主线来源：`memory/project/roadmap.md`
- 当前任务入口：`tasks/queue/task-001-repo-refactor.md`

## Default Response Format

1. 已完成清单
2. 证据与当前结论适用边界
3. 风险与待决策
4. 下一步

## Mutation Gate

- 只读分析不强制同步。
- 任何文件改动前先运行 `python3 scripts/pre_mutation_check.py`。
- 若 worktree 不干净、存在 staged changes、或分支 `behind/diverged`，先整理或 `git pull --rebase`。
- 可在本地短分支完成开发，但发布动作只认 `main`。
- 发布前必须通过 release build 与 smoke gate；线上回滚走 release registry，不走 git reset。

## Required Reads

- `docs/PROJECT_RULES.md`
- `docs/ARCHITECTURE.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- 当前任务文件

## Working Order

1. 先读 `AGENTS.md`
2. 再读 `docs/PROJECT_RULES.md` 和 `docs/ARCHITECTURE.md`
3. 再读当前任务、相关 `module.md`、`code_index/*` 与必要记忆
4. 运行 `python3 scripts/pre_mutation_check.py`
5. 只构建最小必要上下文后再改代码
6. 改动后更新 task / memory / code_index / docs
7. 进入 `main` 后再准备 release 与 cutover

## Read More If...

- 代码治理、命名、体量限制：`docs/PROJECT_RULES.md`
- 系统结构、模块边界、依赖方向：`docs/ARCHITECTURE.md`
- worktree / task / PR / reporting：`docs/DEV_WORKFLOW.md`
- AI 标准工作流、上下文和记忆回写：`docs/AI_OPERATING_MODEL.md`
- 系统状态、roadmap、技术债：`memory/project/*`
- 经验和 ADR：`memory/experience/*`、`memory/decisions/*`
- 模块和函数导航：`code_index/*`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
