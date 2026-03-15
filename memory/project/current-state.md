---
title: CURRENT_STATE
doc_role: memory
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-15
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - tasks/queue/task-001-repo-refactor.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 当前状态

## 项目概览

- 项目名称：Compounding AI Operating System
- 当前阶段：公司介绍式首页与组织架构收口
- 当前优先级：把首页升级成创业团队 operating system，总结组织架构、今日作战、核心系统、新人入职路径与当前风险，并让这些摘要全部稳定映射到 Markdown 真相源。
- 成功定义：首页像创业团队公司介绍页一样高浓度、易理解；新人只看首页就知道项目是谁、当前打什么仗、谁负责什么、下一步先看哪里；组织、任务、记忆、索引和发布信息都能从真相源稳定映射出来。
- 必须保护：AGENTS.md 是唯一主源，Git 文件即真相，关键改动先 review 再写入，不引入平行规则体系，发布失败不影响当前线上版本
- 运行边界：server-only

## 当前焦点

- 首页收口成“公司介绍 + 今日作战板”，让新人看一眼就知道项目是谁、现在打什么仗、谁负责什么
- 新增 `docs/ORG_MODEL.md`，把 7 个角色卡片和组织原则固定成唯一真相源
- 首页和文档页的语义入口改成组织语言，而不是目录语言
- 保持 task / memory / code_index / roadmap 的回写闭环，不引入新的平行体系

## 下一检查点

- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`
- `node --experimental-strip-types scripts/ai/validate-change-trace.ts`

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
