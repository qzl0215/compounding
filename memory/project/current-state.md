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
- 当前阶段：建立 dev 预览与验收发布链
- 当前优先级：把“先 task、后 dev 预览、验收通过后再发 main 与生产”的习惯同时写入文档、脚本门禁与发布页面。
- 成功定义：每次改动都必须更新 task；每轮可验收改动都会先给出 dev 预览链接；若存在未验收 dev，系统会先提醒；验收通过后能晋升到 `main` 与本地生产，并再次给出生产验收链接。
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

- 建立 `dev / prod` 双通道 release registry，并明确 pending / accepted / rejected 语义
- 强化 task 更新门禁，确保任何 repo-tracked 改动都必须回写 task
- 让 `/releases`、`/tasks` 与首页风险区都能解释“当前是否存在未验收 dev”
- 把页面和聊天统一到同一套验收/晋升真相源

## 关键冻结项

- 不恢复旧 workflow 前台和重型多步骤表单
- 不把 task 演化成审批流或重型工单系统
- 不新增平行读模型或后台数据库

## 下一检查点

- 定义静态、构建、运行时与 AI 输出四层验证边界
- `docs/DEV_WORKFLOW.md` 明确推荐校验顺序与失败语义
- 发布前门禁能按层次解释“先跑什么、为什么失败、下一步做什么”
- `task-010` 进入执行入口并具备可追踪分支
- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
