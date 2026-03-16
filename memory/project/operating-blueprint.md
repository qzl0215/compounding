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

本地生产运行时稳定化

## 关键子目标

### 本地生产运行时

- 发布标准：
  - `pnpm prod:start / stop / status / check` 可用
  - 本地生产启动后会写入单一运行态元数据
- 关联任务：
  - `tasks/queue/task-007-local-prod-runtime-stability.md`

### Release 切换联动

- 发布标准：
  - 若本地生产已在运行，`release:switch` 与 `release:rollback` 会自动最小重启
  - 若本地生产未运行，切换和回滚不会偷偷启动新进程
- 关联任务：
  - `tasks/queue/task-007-local-prod-runtime-stability.md`

### 运行态可观测

- 发布标准：
  - `/releases` 能明确显示未启动、运行中、PID 失效、端口异常、版本漂移
  - 页面问题能被直接解释为“服务未运行”或“版本漂移”，而不是泛泛报错
- 关联任务：
  - `tasks/queue/task-007-local-prod-runtime-stability.md`

### 页面在线与样式健康

- 发布标准：
  - 首页、任务页、文档页、发布页都能通过本地生产健康检查
  - CSS 资源路由返回 `200`，页面不再出现裸 HTML
- 关联任务：
  - `tasks/queue/task-007-local-prod-runtime-stability.md`

## 当前阻塞

- 当前无结构性阻塞；继续用本地运行态与页面健康检查监控 release、端口与页面样式是否一致。

## 下一检查点

- 本地生产状态与 `/releases` 页面显示一致
- release 切换后运行中的本地生产自动最小重启
- 健康检查同时验证关键页面与当前激活 release id

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
