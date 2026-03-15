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
## 硬规则

- `AGENTS.md` 是仓库内唯一高频执行主源；长文规则落在 `docs/*`，状态和经验落在 `memory/*`。
- 默认先做只读盘点，再做最小可验证改动。
- 默认先做高 ROI 动作，不做过度工程和抽象炫技。
- 任何结构性改动都必须绑定任务、更新相关记忆，并在进入 `main` 前完成 review。
- 巨型 util / helper / common 不允许继续扩张；新增逻辑必须伴随清理或明确删除计划。
- 经验先写入 `memory/experience/*`，稳定后再升格到 `docs/*` 或 `AGENTS.md`。
- 任务是边界，不是官僚表单；roadmap 只记录主线变化，不追踪碎片执行。
- 规范是为了避免熵增，不是为了制造新的熵增；若规则本身拖慢主线，可直接简化规则。
- 生产发布只认 `main`；回滚通过 release 切换完成，不通过 `git reset` 改写线上状态。
- 组织角色只是稳定职责镜头，不是官僚部门；组织设计并入总经办，不单列 HR。

## 当前状态

- 项目名称：Compounding AI Operating System
- 项目一句话：把当前仓库升级成适合 AI 长期协作、任务驱动、可持续重构与自进化的 AI-Native Repo。
- 当前优先级：把首页升级成创业团队 operating system，总结组织架构、今日作战、核心系统、新人入职路径与当前风险，并让这些摘要全部稳定映射到 Markdown 真相源。
- 成功定义：首页像创业团队公司介绍页一样高浓度、易理解；新人只看首页就知道项目是谁、当前打什么仗、谁负责什么、下一步先看哪里；组织、任务、记忆、索引和发布信息都能从真相源稳定映射出来。
- 必须保护：AGENTS.md 是唯一主源，Git 文件即真相，关键改动先 review 再写入，不引入平行规则体系，发布失败不影响当前线上版本
- 运行边界：server-only
- 当前主线来源：`memory/project/roadmap.md`
- 当前任务入口：`tasks/queue/*.md`，优先处理 `doing` 状态任务

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

## 必读文档

- `docs/PROJECT_RULES.md`
- `docs/ARCHITECTURE.md`
- `docs/ORG_MODEL.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- 当前任务文件

## 工作顺序

1. 先读 `AGENTS.md`
2. 再读 `docs/PROJECT_RULES.md` 和 `docs/ARCHITECTURE.md`
3. 再读当前任务、相关 `module.md`、`code_index/*` 与必要记忆
4. 运行 `python3 scripts/pre_mutation_check.py`
5. 只构建最小必要上下文后再改代码
6. 改动后更新 task / memory / code_index / docs
7. 进入 `main` 后再准备 release 与 cutover

## 按需补读

- 代码治理、命名、体量限制：`docs/PROJECT_RULES.md`
- 系统结构、模块边界、依赖方向：`docs/ARCHITECTURE.md`
- worktree / task / PR / reporting：`docs/DEV_WORKFLOW.md`
- AI 标准工作流、上下文和记忆回写：`docs/AI_OPERATING_MODEL.md`
- 组织架构、角色职责、组织设计：`docs/ORG_MODEL.md`
- 系统状态、roadmap、技术债：`memory/project/*`
- 经验和 ADR：`memory/experience/*`、`memory/decisions/*`
- 模块和函数导航：`code_index/*`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

## 人工备注

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
