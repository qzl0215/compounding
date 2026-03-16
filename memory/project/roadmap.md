---
title: ROADMAP
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-16
source_of_truth: tasks/queue/task-001-repo-refactor.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-001-repo-refactor.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 路线图

## 当前阶段

AI 工作模式产品化

## 下个里程碑

把工作模式从角色文档中剥离成独立真相源，并让首页、`AGENTS`、任务模板和 AI 工作流入口都能沿统一业务链承接这些模式，避免角色与模式继续混写。

## 里程碑成功标准

- 系统明确收口为少数几个高频工作模式，而不是继续平铺角色名称
- `docs/WORK_MODES.md` 成为工作模式唯一详细真相源
- `docs/ORG_MODEL.md` 只保留角色职责，不再承载工作模式正文
- 首页能用流程链呈现工作模式与组织职责的关系
- `AGENTS`、`AI_OPERATING_MODEL`、task 模板对工作模式的定义与用法保持一致

## 当前优先级

把工作模式从角色文档中剥离成独立真相源，并让首页、`AGENTS`、任务模板和 AI 工作流入口沿统一业务链承接这些模式。

## 当前执行待办

- [x] 把工作模式从 `ORG_MODEL` 中剥离成独立真相源
- [x] 让 `AGENTS` 只保留工作模式摘要，详细定义集中到 `WORK_MODES`
- [x] 让首页改成工作模式流程链，而不是继续展示模式卡片
- [x] 让 task 模板与任务展示支持 `当前模式`
- [x] 更新 `AI_OPERATING_MODEL`、`current-state` 与 `operating-blueprint` 的模式边界

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
