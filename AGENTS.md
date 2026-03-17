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
  - docs/WORK_MODES.md
  - docs/DEV_WORKFLOW.md
  - docs/AI_OPERATING_MODEL.md
  - memory/project/current-state.md
  - memory/project/roadmap.md
last_reviewed_at: 2026-03-16
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
## 硬规则

- `AGENTS.md` 是仓库内唯一高频执行主源；长文规则落在 `docs/*`，状态和经验落在 `memory/*`。
- 默认先做只读盘点，再做最小可验证改动。
- 默认先做高 ROI 动作，不做过度工程和抽象炫技。
- 任何结构性改动都必须绑定任务、更新相关记忆，并在进入 `main` 前完成 review。
- 每个执行 task 对应一条短分支；任务状态、最近提交与是否并入 `main` 必须可追踪。
- 每次改动都必须绑定并更新 task；若存在 repo-tracked 改动但无 task 更新，校验器必须直接失败。
- 巨型 util / helper / common 不允许继续扩张；新增逻辑必须伴随清理或明确删除计划。
- 经验先写入 `memory/experience/*`，稳定后再升格到 `docs/*` 或 `AGENTS.md`。
- 任务是边界，不是官僚表单；roadmap 只记录主线变化，不追踪碎片执行。
- 若里程碑、运营蓝图或关键发布标准不清晰，先创建规划 task，再与用户共商，不得直接进入执行实现。
- 规范是为了避免熵增，不是为了制造新的熵增；若规则本身拖慢主线，可直接简化规则。
- 生产发布只认 `main`；`dev` 只是 preview channel，不是长期 git 主分支；回滚通过 release 切换完成，不通过 `git reset` 改写线上状态。
- 组织角色只是稳定职责镜头，不是官僚部门；组织设计并入总经办，不单列 HR。

## 当前状态

- 项目名称：Compounding AI Operating System
- 项目一句话：把当前仓库升级成适合 AI 长期协作、任务驱动、可持续重构与自进化的 AI-Native Repo。
- 当前优先级：建设防漂移文档与索引资产，优先盘点 prompt、索引与关键说明文档，明确哪些走生成、哪些走校验、哪些继续人工维护。
- 成功定义：高频知识资产的真相源、维护方式与回退边界清楚；至少一类资产具备可执行的防漂移机制，且不引入新的平行真相源。
- 必须保护：AGENTS.md 是唯一主源，Git 文件即真相，关键改动先 review 再写入，不引入平行规则体系，发布失败不影响当前线上版本
- 运行边界：server-only
- 当前主线来源：`memory/project/roadmap.md`
- 当前战术蓝图来源：`memory/project/operating-blueprint.md`
- 当前任务入口：`tasks/queue/*.md`，优先处理 `doing` 状态任务，并校验 task/Git 一致性

## 工作模式摘要

- 战略澄清：当 roadmap、蓝图或发布标准不清时进入；关键产物是更新后的 `roadmap / operating-blueprint` 与规划 task。
- 方案评审：当需求已澄清、准备动手时进入；关键产物是方案结论、范围、验收标准与 task 约束。
- 工程执行：当 task 与方案边界已明确时进入；关键产物是代码改动、回写结果与可审查提交。
- 质量验收：当实现完成、准备交付时进入；关键产物是通过/不通过结论、风险说明与 task 状态建议。
- 发布复盘：当结果已通过验收时进入；关键产物是 `main` 合并、release 切换/回滚结果与经验沉淀。

## 默认回复格式

1. 已完成清单
2. 证据与当前结论适用边界
3. 风险与待决策
4. 下一步

## 改动门禁

- 只读分析不强制同步。
- 任何文件改动前先运行 `python3 scripts/pre_mutation_check.py`。
- 若 worktree 不干净、存在 staged changes、或分支 `behind/diverged`，先整理或 `git pull --rebase`。
- 可在本地短分支完成开发，但发布动作只认 `main`。
- 发布前必须通过 release build 与 smoke gate；线上回滚走 release registry，不走 git reset。
- 发布和回滚动作必须串行执行，禁止并发切换 release。
- 本地生产是手动拉起的常驻进程；`main` 已更新不等于 `3000` 端口自动在线。
- 本地生产生效的判定是：`current` 已切到目标 release、常驻进程正在运行、`prod:check` 通过。
- 默认推荐校验顺序是：静态门禁 → 构建门禁 → 运行时门禁；只有 AI 相关资产变化时，再补 AI 输出门禁。
- 每轮可验收改动默认先生成 `dev` 预览；若已有未验收 `dev`，先提醒用户验收上一个 `dev`。
- `dev` 验收通过后，才允许晋升到 `main` 与本地生产，并再次提供生产环境验收链接。

## 必读文档

- `docs/PROJECT_RULES.md`
- `docs/ARCHITECTURE.md`
- `docs/ORG_MODEL.md`
- `docs/WORK_MODES.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- 当前任务文件

## 工作顺序

1. 先读 `AGENTS.md`
2. 再读 `docs/PROJECT_RULES.md` 和 `docs/ARCHITECTURE.md`
3. 再读 `memory/project/roadmap.md` 与 `memory/project/operating-blueprint.md`
4. 若规划不清，先创建规划 task 并与用户对齐
5. 再读当前任务、相关 `module.md`、`code_index/*` 与必要记忆
6. 运行 `python3 scripts/pre_mutation_check.py`
7. 只构建最小必要上下文后再改代码
8. 改动后更新 task / memory / code_index / docs
9. 进入 `main` 后再准备 release 与 cutover

## 按需补读

- 代码治理、命名、体量限制：`docs/PROJECT_RULES.md`
- 系统结构、模块边界、依赖方向：`docs/ARCHITECTURE.md`
- worktree / task / PR / reporting：`docs/DEV_WORKFLOW.md`
- AI 标准工作流、上下文和记忆回写：`docs/AI_OPERATING_MODEL.md`
- 组织架构、角色职责、组织设计：`docs/ORG_MODEL.md`
- 工作模式、输入输出与进入退出条件：`docs/WORK_MODES.md`
- 系统状态、roadmap、运营蓝图、技术债：`memory/project/*`
- 经验和 ADR：`memory/experience/*`、`memory/decisions/*`
- 模块和函数导航：`code_index/*`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

## 人工备注

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
