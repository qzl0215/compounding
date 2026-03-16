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

建立分层验证体系

## 下个里程碑

把现有检查收口成静态、构建、运行时与 AI 输出四层验证体系，并明确发布前和本地开发期的推荐校验顺序。

## 里程碑成功标准

- 验证体系被清晰收口为静态、构建、运行时与 AI 输出四层
- 任意执行者能快速判断当前需要跑哪一层检查
- 发布前关键门禁顺序、失败语义与下一步动作清楚可解释
- 现有检查脚本得到复用，而不是被新的重复脚本替代
- `AGENTS`、`DEV_WORKFLOW`、`AI_OPERATING_MODEL` 对验证分层与使用顺序保持一致

## 当前优先级

把现有检查收口成静态、构建、运行时与 AI 输出四层门禁，并明确发布前推荐校验顺序。

## 当前执行待办

- [ ] 盘点现有校验脚本，按静态、构建、运行时与 AI 输出四层重新分组
- [ ] 定义每一层的适用场景、必跑时机、失败语义与推荐命令入口
- [ ] 收口发布前和本地开发期的推荐校验顺序
- [ ] 更新 `DEV_WORKFLOW`、`AI_OPERATING_MODEL` 与相关页面说明，避免重复和冲突

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
