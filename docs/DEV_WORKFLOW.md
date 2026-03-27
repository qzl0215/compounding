---
title: DEV_WORKFLOW
update_mode: manual
status: active
last_reviewed_at: 2026-03-27
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/WORK_MODES.md
  - docs/ARCHITECTURE.md
  - tasks/templates/task-template.md
  - memory/project/current-state.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 开发工作流

## 主发布规则

- `main` 是唯一生产主线。
- `dev` 是 preview channel，不是长期 git 主分支。
- 同一时间只允许一个待验收 `dev`。

## 进入前判断

- 先按 `docs/WORK_MODES.md` 判断当前处于哪个场景，再决定是否建 task、是否直接执行。
- `task` 是执行边界，不承接未成熟需求；模糊事项继续留在 `roadmap / operating-blueprint`。
- 当前只允许一层 plan；唯一 plan 主源是 `memory/project/operating-blueprint.md`。

## 预任务护栏

- 动手前统一入口是 `pnpm preflight`。
- `light` 改动默认只执行基础 gate；`structural / release` task 动手前默认跑 `pnpm preflight -- --taskId=t-xxx`。
- `coord:check:pre-task` 只保留为兼容别名，输出 contract 与 `pnpm preflight -- --taskId=t-xxx` 一致。
- 完整 task guard 输出会附带 `iteration_digest_path / retro_candidates_path / retro_hints`；新 Agent 开工前先看上一轮时间主要耗在哪个阶段、最近 blocker 是什么、有没有现成 shortcut。
- 涉及服务器访问、GitHub 接入方式或标准发布动作时，先读 `bootstrap/project_operator.yaml`；人类扫读版在 `docs/OPERATOR_RUNBOOK.md`。
- 若属于 unfamiliar pattern / infra / runtime capability，先用 `coord:task:search` 记录最小 search evidence。
- 完整 task guard 默认检查：
  - 工作区是否干净
  - 任务 companion
  - search evidence
  - scope guard
  - 运行态状态
  - file/module 锁状态
- 若发现工作区未清理、运行态异常、scope 越界或锁冲突，完整 task guard 输出决策卡，不直接开工。

## 规划链

- 先读 `memory/project/operating-blueprint.md`，再对齐 `memory/project/roadmap.md`。
- 先扩选项，再收关键决策。
- planning 只留在 `memory/project/operating-blueprint.md`；边界、范围外、完成定义和约束清楚后，再用 `scripts/ai/create-task.ts` 创建执行 task。
- 新建 task 的人类标题必须直接写在中文摘要里，不要把 `task-xxx`、英文缩写或英文路径当标题。
- 计划评审、release 复盘或当前没有更高优先级产品任务时，可运行 `pnpm ai:cleanup-candidates` 暴露小型熵减候选；报告只作为临时输入，不回写成新的状态源。
- 若要集中看重复耗时/阻塞模式，可运行 `pnpm ai:retro-candidates`；它只扫描 companion digest 生成候选，不会直接写 `memory/experience/*`。

## 执行链

- 先读当前 task、`memory/project/current-state.md`、相关 `module.md`、`code_index/*`。
- 进入模块和运行时边界前，再补 `docs/ARCHITECTURE.md`。
- 需要上下文压缩时，用 `scripts/ai/build-context.ts`。
- 动手前先跑 `pnpm preflight`；若已绑定 `structural / release` task，则跑 `pnpm preflight -- --taskId=t-xxx`。
- `coord:task:handoff`、`coord:review:run`、`release:prepare`、`accept-dev-release`、`reject-dev-release` 与 `rollback-release` 会自动写阶段 activity；raw trace 24 小时后 compact 进 companion digest。
- 小而边界清楚的 task，默认做到最小完整闭环；若边界重新变大，退回 plan。

## 交付链

- 先跑 `node --experimental-strip-types scripts/ai/validate-change-trace.ts` 与 `node --experimental-strip-types scripts/ai/validate-task-git-link.ts`。
- 再准备 `dev` 预览：`node --experimental-strip-types scripts/release/prepare-release.ts --ref HEAD --channel dev`；这一步默认同时完成 release build 与 smoke gate。
- 若已有未验收 `dev`，先提醒用户验收上一个 `dev`。
- 用户验收通过后，再晋升到 `main` 与本地生产。
- 最后用 `pnpm prod:status`、`pnpm prod:check` 和 `/releases` 完成生产验收。
- 具体服务器访问面、GitHub 接入方式和标准命令以 `bootstrap/project_operator.yaml` 为准，不再散落写在多份 runbook 里。

## 分层验证顺序

- 静态门禁：`pnpm validate:static`
- 构建门禁：`pnpm validate:build`
- 运行时门禁：`pnpm preview:check`、`pnpm prod:check`
- AI 输出门禁：`pnpm validate:ai-output`
- knowledge assets 默认在 `pnpm ai:validate-assets` 中给出 freshness / quality 结论；`pnpm validate:static:strict` 会把高频主干文档 stale 状态升级成硬失败。
- 默认顺序是静态 → 构建 → 运行时 → AI 输出；只有 AI 相关资产变化时再补 AI 输出门禁。

## 文档与任务规则

- 默认先更新 task 执行合同，再改代码；机器台账改由 companion、release 与投影层回写。
- 每个 `structural / release` 改动必须绑定 `tasks/queue/*`。
- 每个 task 至少写清：
  - `任务 ID`
  - `短编号`
  - `父计划`
  - `任务摘要`
  - `为什么现在`
  - `承接边界`
  - `完成定义`
  - `要做`
  - `不做`
  - `约束`
  - `关键风险`
  - `测试策略`
  - `状态`
  - `体验验收结果`
  - `交付结果`
  - `复盘`
- `light` 改动可只更新 `docs / memory / code_index / 现有 task`。
- 任务页与门户展示默认优先读中文任务摘要；若标题只是 `任务 task-xxx` 这类机器壳，会自动回退到摘要。

## 发布规则

- 每轮 release 默认绑定 1 个主 task，可选少量辅助 task。
- `dev` 预览先出，再验收，再晋升到 `main` 和本地生产。
- 发布和回滚动作必须串行执行。
- 本地生产默认不自动拉起；需要手动执行 `pnpm prod:start`。
- 若新版异常，优先继续在 `main` 修下一次 release，或直接回滚到上一个健康 release。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
