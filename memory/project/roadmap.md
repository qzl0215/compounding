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

AI-Native Repo 第一轮收口

## Current Priority

完成 AI-Native Repo 第一轮结构收敛，并继续压缩剩余软上限文件与命名技术债。

## Acceptance Ladder

1. 规则层已建立
2. 记忆层已建立
3. 上下文层已建立
4. 第一批微模块已落地
5. 旧前台和旧 API 已从默认构建入口移除

## Current Execution TODOs

- [x] 建立 `AGENTS + docs/*` 宪法层
- [x] 建立 `memory / tasks / code_index / scripts/ai` 骨架
- [x] 删除旧 workflow 前台、旧 API、旧组件
- [x] 稳定 bootstrap 引擎拆分后的 scaffold / audit / propose / apply
- [x] 让 code health scan 与 module index 进入日常工作流
- [x] 继续压缩高于软上限的 bootstrap 模块
- [x] 收敛共享 classnames helper 的命名债
- [x] 把 proposal 升级为模型优先生成 + block-level apply contract
- [x] 让 `build-context.ts` 按 task / module / memory 精准选材
- [x] 把 code health strict gate 接入 CI

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
