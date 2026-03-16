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

本地生产运行时稳定化

## 下个里程碑

本地生产进入长期可维护状态：`main` 对应的 release 可被手动稳定拉起、本机运行态可被明确观测、切换与回滚可自动最小重启，页面不再因为临时 dev 进程或资源漂移而裸奔或拒绝连接。

## 里程碑成功标准

- `pnpm prod:start`、`pnpm prod:stop`、`pnpm prod:status`、`pnpm prod:check` 可用
- 当前 release 切换后，若本地生产已在运行，则会自动最小重启到新的 `current`
- 若本地生产未运行，release 切换不会偷偷启动新进程，但 `/releases` 能明确说明原因
- `/`、`/tasks`、`/knowledge-base?path=AGENTS.md`、`/releases` 在本地生产态返回 `200`
- 首页不再因为 CSS 资源失联而显示裸页面

## 当前优先级

把本地生产运行时补齐为手动拉起、显式可观测、可随 release 切换与回滚稳定重启的长期可维护模型。

## 当前执行待办

- [x] 新增本地生产运行时脚本：启动、停止、状态、重启、健康检查
- [x] 让 release 切换与回滚在本地运行中时自动最小重启
- [x] 在 `/releases` 展示本地生产运行态与版本漂移
- [x] 准备并切换新的 release，再手动拉起本地生产完成验收
- [x] 同步更新 task / docs / index，并解释本地生产为何会失败或未启动

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
