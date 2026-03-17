---
title: OPERATING_BLUEPRINT
doc_role: planning
update_mode: manual
owner_role: PMO
status: active
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/current-state.md
  - tasks/queue/task-001-repo-refactor.md
last_reviewed_at: 2026-03-16
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

建立 dev 预览与验收发布链

## 关键子目标

### dev 通道与验收状态

- 发布标准：
  - release registry 明确支持 `dev / prod` 双通道
  - 待验收 `dev` 至少包含 `pending / accepted / rejected` 语义
- 关联任务：
  - `tasks/queue/task-014-dev-preview-channel.md`

### task 硬门禁

- 发布标准：
  - 任何 repo-tracked 改动若未更新 task，会被脚本门禁拦下
  - task / Git / 当前分支关系可被明确校验
- 关联任务：
  - `tasks/queue/task-014-dev-preview-channel.md`

### 验收链接与页面提醒

- 发布标准：
  - dev 预览生成后会默认给出验收链接
  - 验收通过后会再次给出 production 验收链接
  - `/releases` 与 `/tasks` 都能解释当前是否存在未验收 dev
- 关联任务：
  - `tasks/queue/task-014-dev-preview-channel.md`

## 当前阻塞

- 当前无结构性阻塞；关键在于把 dev 预览链路做成真正代码化状态，而不是只写口头约定。

## 下一检查点

- dev 预览能生成待验收链接，且同一时间只允许一个 pending dev
- 验收通过后，能晋升到 `main` 与本地生产
- `task-014` 的执行状态、分支和最近提交可追踪

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
