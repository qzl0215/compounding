---
title: ROADMAP
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-15
source_of_truth: tasks/queue/task-001-repo-refactor.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - tasks/queue/task-001-repo-refactor.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Roadmap

## Current Phase

生产直发与可回滚发布模型收口

## Current Priority

切到 main 直发生产，并补齐最小影响发布、回滚和本机管理入口。

## Acceptance Ladder

1. 生产构建样式稳定
2. `main` 成为唯一生产主线
3. release 准备、切换与回滚骨架可用
4. UI 可查看近期 releases 与改动摘要
5. 失败发布不会切走当前线上版本

## Current Execution TODOs

- [x] 修复生产态 Tailwind 裁剪，恢复首页和文档页样式
- [x] 切换到 `main = production` 的发布规则
- [x] 建立 `releases/<id> + current + shared + registry.json`
- [x] 新增本机/内网发布管理页与 deploy / rollback API
- [x] 补齐 systemd 与 reverse proxy skeleton
- [x] 把发布与回滚规则写回 AGENTS / docs / memory

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
