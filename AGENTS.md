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
  - docs/ASSET_MAINTENANCE.md
  - memory/project/current-state.md
  - memory/project/roadmap.md
last_reviewed_at: 2026-03-22
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
## 硬规则

- `AGENTS.md` 是仓库内唯一高频执行主源；长文规则落在 `docs/*`，状态和经验落在 `memory/*`。
- 任何改动前必须先读 `docs/PROJECT_RULES.md` 与 `docs/ARCHITECTURE.md`，再进入对应工作流文档。
- 默认先做只读盘点，再做最小可验证改动。
- 默认先做高 ROI 动作，不做过度工程和抽象炫技。
- 改动门禁固定分级：`light` 只覆盖 `docs/*`、`memory/*`、`code_index/*`、现有 `tasks/queue/*`；`structural` 覆盖代码、脚本、模板与依赖；`release` 覆盖发布和运行时链路。
- 任何结构性改动都必须绑定任务、更新相关记忆，并在进入 `main` 前完成 review。
- 每个执行 task 对应一条短分支；任务状态、最近提交与是否并入 `main` 必须可追踪。
- `light` 改动允许无 task 硬阻断；`structural / release` 改动若没有 task 更新，校验器必须直接失败。
- task 短编号必须全局唯一，并显式写入任务文档；不允许再靠文件名或序号隐式推导。
- 巨型 util / helper / common 不允许继续扩张；新增逻辑必须伴随清理或明确删除计划。
- 经验先写入 `memory/experience/*`，稳定后再升格到 `docs/*` 或 `AGENTS.md`。
- 任务是边界，不是官僚表单；roadmap 只记录主线变化，不追踪碎片执行。
- 若里程碑、运营蓝图或关键发布标准不清晰，先创建规划 task，再与用户共商，不得直接进入执行实现。
- 规范是为了避免熵增，不是为了制造新的熵增；若规则本身拖慢主线，可直接简化规则。
- 生产发布只认 `main`；`dev` 只是 preview channel，不是长期 git 主分支；回滚通过 release 切换完成，不通过 `git reset` 改写线上状态。
- 组织角色只是稳定职责镜头，不是官僚部门；组织设计并入总经办，不单列 HR。

## 真相源地图

- 战略真相：`memory/project/roadmap.md`
- 运营快照：`memory/project/current-state.md`
- 战术蓝图：`memory/project/operating-blueprint.md`
- 角色定义：`docs/ORG_MODEL.md`
- 工作模式：`docs/WORK_MODES.md`
- 工作流：`docs/DEV_WORKFLOW.md`
- AI 行为：`docs/AI_OPERATING_MODEL.md`
- 代码导航：`code_index/*`
- 任务入口：`tasks/queue/*.md`
- 高频知识资产：`docs/ASSET_MAINTENANCE.md`

## 默认回复格式

1. 已完成清单
2. 证据与当前结论适用边界
3. 风险与待决策
4. 下一步

## 默认沟通契约

- 交付 `dev` 或 production 页面时，默认同时提供：
  - 环境说明
  - 页面链接
  - 如何验收
- 进入下一候选任务时，默认先提供：
  - 中文任务摘要
  - 可执行方案
  - 待用户确认后再执行
- 任务在对话中默认使用“中文任务摘要 + 短编号”表达；短编号格式固定为 `t-xxx`。

## 改动门禁

- 只读分析不强制同步。
- 任何文件改动前先运行 `python3 scripts/pre_mutation_check.py`。
- 若 worktree 不干净、存在 staged changes、或分支 `behind/diverged`，先整理或 `git pull --rebase`。
- 可在本地短分支完成开发，但发布动作只认 `main`。
- 发布前必须通过 release build 与 smoke gate；线上回滚走 release registry，不走 git reset。
- 发布和回滚动作必须串行执行，禁止并发切换 release。
- 本地生产是手动拉起的常驻进程；`main` 已更新不等于本机生产端口自动在线。当前本地默认端口是 `3010`，预览默认端口是 `3011`。
- 本地生产生效的判定是：`current` 已切到目标 release、常驻进程正在运行、`prod:check` 通过。
- 默认推荐校验顺序是：静态门禁 → 构建门禁 → 运行时门禁；只有 AI 相关资产变化时，再补 AI 输出门禁。
- `light` 改动可跳过 `coord:check:pre-task` 与 companion；`structural / release` 动手前默认先跑 `coord:check:pre-task`，它会同时检查任务 companion、scope guard、运行态与锁状态；高风险时输出决策卡。
- 每轮可验收改动默认先生成 `dev` 预览；若已有未验收 `dev`，先提醒用户验收上一个 `dev`。
- `dev` 验收通过后，才允许晋升到 `main` 与本地生产，并再次提供生产环境验收链接。
- release 默认绑定 1 个主 task，可附带少量辅助 task；task 是执行边界，release 是验收与回滚边界。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

## 人工备注

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
