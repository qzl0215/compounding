---
title: CURRENT_STATE
doc_role: memory
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-16
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-001-repo-refactor.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 当前状态

## 项目概览

- 项目名称：Compounding AI Operating System
- 当前阶段：本地生产运行时稳定化
- 当前优先级：把本地生产运行时补齐为手动拉起、显式可观测、可随 release 切换与回滚稳定重启的长期可维护模型。
- 成功定义：首页成为一页经营驾驶舱；用户与 AI 能快速看懂使命、路线图、运营蓝图、组织职责与认知资产边界，并能沿统一 task 闭环持续推进。
- 必须保护：AGENTS.md 是唯一主源，Git 文件即真相，关键改动先 review 再写入，不引入平行规则体系，发布失败不影响当前线上版本
- 运行边界：server-only

## 使命与愿景

- 使命：把当前仓库升级成适合 AI 长期协作、任务驱动、可持续重构与自进化的 AI-Native Repo。
- 愿景：让这个项目既像创业团队一样高效推进，又能把经验、结构和发布能力持续沉淀成复利系统。

## 核心价值观

- 规则服务于效率，不服务于扩张
- 持续抓重点，不过度优化
- 少条条框框，但井井有条

## 当前焦点

- 为 `release/current` 补齐本地常驻运行时，避免页面依赖临时 `next dev`
- 让本地生产状态能被页面和脚本直接观测，而不是靠浏览器报错倒推
- 让切换与回滚在本地生产已运行时自动最小重启，在未运行时保持静默
- 用健康检查直接验证首页、任务页、文档页、发布页与 CSS 资源都真实在线
- 确保运行中的生产进程显式读取正确的 workspace/release 根目录，避免页面返回 `200` 但运行态上下文失真

## 关键冻结项

- 不恢复旧 workflow 前台和重型多步骤表单
- 不把 task 演化成审批流或重型工单系统
- 不新增平行读模型或后台数据库

## 下一检查点

- `pnpm prod:start`
- `pnpm prod:status`
- `pnpm prod:check`
- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
