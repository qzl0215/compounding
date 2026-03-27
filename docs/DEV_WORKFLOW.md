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

## Canonical State

- 任务唯一状态机主源是 `kernel/task-state-machine.yaml`。
- 当前状态只写 companion `machine.state_id / mode_id / delivery_track / blocked_* / last_transition`。
- task 正文 `状态` 只作派生展示；顶层 `current_mode` 只保留兼容读。
- 历史 task 不批量迁移；缺少 canonical machine 时按兼容规则派生。

## 状态与事件

- `create_task -> planning`
- `plan_approved -> ready`
- `preflight_passed -> executing`
- `handoff_created -> review_pending`
- `review_started -> reviewing`
- `review_passed + direct_merge -> released`
- `review_passed + preview_release -> release_preparing -> acceptance_pending -> released`
- `acceptance_rejected -> blocked(resume_to=executing)`
- `rollback_completed -> rolled_back`
- `block / resume / replan / abandon` 只能通过显式 override 事件触发，且必须带 `reason`

## Guard

- 动手前统一入口是 `pnpm preflight`。
- `light` 改动默认只过基础 gate；`structural / release` task 默认跑 `pnpm preflight -- --taskId=t-xxx`。
- 完整 task guard 检查：worktree、companion、search evidence、scope guard、runtime、lock。
- 发现 worktree 不干净、分支不同步、scope 越界、运行态异常或锁冲突时，先解决 guard，不跳过。
- unfamiliar pattern / infra / runtime capability 先用 `pnpm coord:task:search -- --taskId=t-xxx --conclusion="..."` 记录最小 evidence。

## 命令入口

- 创建 task：`pnpm coord:task:create -- --taskId=t-xxx --summary="中文直给概述" --why="为什么现在"`
- planning -> ready：`pnpm coord:task:start -- --taskId=t-xxx`
- ready -> executing：`pnpm preflight -- --taskId=t-xxx`
- execution -> review_pending：`pnpm coord:task:handoff -- --taskId=t-xxx`
- review：`pnpm coord:review:run -- --taskId=t-xxx`
- override transition：`pnpm coord:task:transition -- --taskId=t-xxx --event=<event> --reason="..."`
- preview prepare：`pnpm release:prepare -- --ref HEAD --channel dev --primary-task task-xxx`
- preview accept / reject：`pnpm release:accept-dev -- --release <releaseId>` / `node --experimental-strip-types scripts/release/reject-dev-release.ts --release <releaseId>`
- rollback：`pnpm release:rollback -- --release <releaseId>`

## 主链 Runbook

1. 需求值得推进但仍未收口时，先留在 `memory/project/operating-blueprint.md`，不要直接建 execution task。
2. 建 task 后默认进入 `planning + undetermined`。
3. `coord:task:start` 代表 planning 已批准，任务进入 `ready`。
4. `pnpm preflight -- --taskId=t-xxx` 通过后自动写 `preflight_passed`，进入 `executing`，并在必要时补决策 `delivery_track`。
5. 完成实现后执行 `coord:task:handoff`，进入 `review_pending`。
6. `coord:review:run` 会自动写 `review_started / review_passed`。
7. `direct_merge` 轨道通过 review 后直接收口为 `released`；`preview_release` 轨道进入 `release_preparing`。
8. preview 通过 `prepare-release` 进入 `acceptance_pending`；验收通过写 `acceptance_accepted`，拒绝写 `acceptance_rejected` 并回到 `blocked(resume_to=executing)`。
9. rollback 成功后写 `rollback_completed`。

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
  - `交付轨道`
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
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
