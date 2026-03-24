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
last_reviewed_at: 2026-03-24
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
## 硬规则

- `AGENTS.md` 只保留会改变执行行为的高频硬规则；长文规则落在 `docs/*`，状态和经验落在 `memory/*`。
- 默认先做只读盘点，再做最小可验证改动。
- 默认先做高 ROI 动作，不做过度工程和抽象炫技。
- 人只做价值判断、需求澄清和结果验收；AI 默认负责执行闭环。
- 只允许一层 plan；`memory/project/operating-blueprint.md` 是唯一 plan 主源，`memory/project/roadmap.md` 只保留战略摘要与里程碑，`memory/project/current-state.md` 只保留运营快照。
- Plan 负责想清楚，task 负责执行合同，companion 负责机器执行上下文，release 负责验收与运行事实。
- 需求不清、范围不清或发布标准不清时，先创建规划 task，再与用户共商。
- 任何结构性改动都必须绑定任务、更新相关记忆，并在进入 `main` 前完成 review。
- 每个执行 task 对应一条短分支；任务状态、最近提交与是否并入 `main` 必须可追踪。
- task 短编号必须全局唯一，并显式写入任务文档；不允许再靠文件名或序号隐式推导。
- 巨型 util / helper / common 不允许继续扩张；新增逻辑必须伴随清理或明确删除计划。
- 经验先写入 `memory/experience/*`，稳定后再升格到 `docs/*` 或 `AGENTS.md`。
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

- 只读分析不强制同步。
- 任何文件改动前先运行 `python3 scripts/pre_mutation_check.py`。
- 若 worktree 不干净、存在 staged changes、或分支 `behind/diverged`，先整理或 `git pull --rebase`。
- 可在本地短分支完成开发，但发布动作只认 `main`。
- 发布前必须通过 release build 与 smoke gate；线上回滚走 release registry，不走 git reset。
- 发布和回滚动作必须串行执行，禁止并发切换 release。
- 本地生产默认端口是 `3010`，预览默认端口是 `3011`。
- 本地生产生效的判定是：`current` 已切到目标 release、常驻进程正在运行、`prod:check` 通过。
- 默认推荐校验顺序是：静态门禁 → 构建门禁 → 运行时门禁；只有 AI 相关资产变化时，再补 AI 输出门禁。
- `light` 改动可跳过 `coord:check:pre-task` 与 companion；`structural / release` 动手前默认先跑 `coord:check:pre-task`，它会同时检查任务 companion、scope guard、运行态与锁状态；高风险时输出决策卡。
- 若 `structural / release` 事项涉及 unfamiliar pattern / infra / runtime capability，动手前先记录最小 search evidence；pre-task 只提醒，不把它做成新审批流。
- 每轮可验收改动默认先生成 `dev` 预览；若已有未验收 `dev`，先提醒用户验收上一个 `dev`。
- `dev` 验收通过后，才允许晋升到 `main` 与本地生产，并再次提供生产环境验收链接。
- release 默认绑定 1 个主 task，可附带少量辅助 task；task 是执行边界，release 是验收与回滚边界。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

## 人工备注

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
