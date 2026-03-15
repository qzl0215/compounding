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
# roadmap

## 当前阶段

中文友好文档、轻量任务清单与全站粘性导航收口

## 当前优先级

收口中文友好文档、轻量任务清单与全站粘性导航，确保每次改动都能沿 task / memory / code_index / roadmap 被追踪。

## 验收阶梯

1. live 文档主标题中文友好
2. `/`、`/tasks`、`/knowledge-base`、`/releases` 都有粘性右侧导航
3. task 模板带更新痕迹，且 `/tasks` 可按状态查看
4. task / memory / code_index / roadmap 的更新闭环可校验
5. 不引入更重的 lane/PR/worktree 制度

## 当前执行待办

- [x] 把所有 live 文档的主标题和一级/二级段落标题改成中文友好写法
- [x] 首页、任务页、文档页、发布页统一使用右侧粘性导航
- [x] 新增 `/tasks` 页面，按 `todo / doing / blocked / done` 管理任务
- [x] task 模板补齐“更新痕迹”
- [x] 接入 `validate-change-trace` 自动校验
- [x] 吸收参考项目中的轻量任务闭环，但不搬重型并行制度

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
