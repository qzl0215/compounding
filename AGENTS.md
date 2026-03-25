---
title: AGENTS
doc_role: source
update_mode: manual
status: active
source_of_truth: AGENTS.md
related_docs:
  - docs/WORK_MODES.md
  - docs/DEV_WORKFLOW.md
  - memory/project/roadmap.md
  - memory/project/current-state.md
  - memory/project/operating-blueprint.md
  - docs/ARCHITECTURE.md
last_reviewed_at: 2026-03-26
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
## 执行原则

- `AGENTS.md` 只保留会直接改变执行动作的高频规则；runbook 落在 `docs/DEV_WORKFLOW.md`，AI 行为落在 `docs/AI_OPERATING_MODEL.md`，专项治理落在 `docs/PROJECT_RULES.md`，状态与经验落在 `memory/*`。
- 人只做价值判断、需求澄清和结果验收；AI 默认负责执行闭环。
- 只允许一层 plan；`memory/project/operating-blueprint.md` 是唯一 plan 主源，`memory/project/roadmap.md` 只保留战略摘要与里程碑，`memory/project/current-state.md` 只保留运营快照。
- Plan 负责想清楚，task 负责执行合同，companion 负责机器执行上下文，release 负责验收与运行事实。
- 需求不清、范围不清或发布标准不清时，先回到 `memory/project/operating-blueprint.md` 收口，不得直接创建执行 task。
- 任何 `structural / release` 改动都必须绑定任务，并在进入 `main` 前完成 review。
- task 短编号必须全局唯一，并显式写入任务文档；不允许再靠文件名或序号隐式推导。
- task 文档的人类标题必须使用中文直给概述；`task-xxx` 与 `t-xxx` 只作机器引用，不得把英文 task id 当标题。
- 生产发布只认 `main`；`dev` 只是 preview channel，不是长期 git 主分支；回滚通过 release 切换完成，不通过 `git reset` 改写线上状态。

## 默认读链

- 先读 `AGENTS.md`。
- 再读 `memory/project/roadmap.md`、`memory/project/current-state.md`、`memory/project/operating-blueprint.md`。
- 需要判断当前处于什么场景时，读 `docs/WORK_MODES.md`。
- 需要执行顺序、门禁和发布 runbook 时，读 `docs/DEV_WORKFLOW.md`。
- 需要仓库拓扑、依赖方向和运行时边界时，读 `docs/ARCHITECTURE.md`。
- 已进入 task 时再读 `tasks/queue/*.md`；需要代码导航时再读 `code_index/*`。
- `docs/PROJECT_RULES.md`、`docs/AI_OPERATING_MODEL.md`、`docs/ASSET_MAINTENANCE.md` 是按需补读的专项附录，不作为默认第一跳。

## 改动门禁

- 任何文件改动前先运行 `pnpm preflight`。
- 若 worktree 不干净、存在 staged changes、或分支 `behind/diverged`，先整理或 `git pull --rebase`。
- `light` 改动默认只过基础 gate；`structural / release` task 动手前默认跑 `pnpm preflight -- --taskId=t-xxx`，它会同时检查任务 companion、scope guard、运行态与锁状态；高风险时输出决策卡。
- `coord:check:pre-task` 只保留为兼容别名，不再作为默认人工入口。
- 若 `structural / release` 事项涉及 unfamiliar pattern / infra / runtime capability，动手前先记录最小 search evidence；pre-task 只提醒，不把它做成新审批流。
- 交付顺序、验证顺序、运行端口和发布细节以 `docs/DEV_WORKFLOW.md` 与 `memory/project/current-state.md` 为准。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

## 人工备注

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
