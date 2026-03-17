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

建立 dev 预览与验收发布链

## 下个里程碑

把“先 task、后 dev 预览、验收通过后再发 main 与生产”的习惯同时写入文档、脚本门禁与发布页面。

## 里程碑成功标准

- 任意 repo-tracked 改动若未更新 task，会被脚本门禁直接拦下
- 每轮可验收改动默认先给出 dev 预览链接
- 若存在未验收 dev，系统会明确提醒并阻止继续出新 pending dev
- dev 验收通过后，能晋升到 `main` 与本地生产，并再次提供生产验收链接
- `AGENTS`、`DEV_WORKFLOW`、`AI_OPERATING_MODEL`、发布页对 dev / prod 双通道语义保持一致

## 当前优先级

把“先 task、后 dev 预览、验收通过后再发 main 与生产”的习惯同时写入文档、脚本门禁与发布页面。

## 当前执行待办

- [ ] 扩展 release registry，支持 `dev / prod` 通道与 pending / accepted / rejected 语义
- [ ] 强化 task 更新门禁，确保任何 repo-tracked 改动都必须回写 task
- [ ] 更新发布页、任务页与首页风险区，让未验收 dev 可被直接解释
- [ ] 把 `AGENTS`、`DEV_WORKFLOW`、`AI_OPERATING_MODEL` 与页面提示统一到同一套验收链路

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
