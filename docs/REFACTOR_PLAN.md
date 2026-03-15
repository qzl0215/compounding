---
title: REFACTOR_PLAN
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-15
source_of_truth: tasks/queue/task-001-repo-refactor.md
related_docs:
  - memory/project/current-state.md
  - memory/project/tech-debt.md
  - memory/project/roadmap.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# REFACTOR_PLAN

## Current Problem Overview

- 当前仓库历史上混合了 bootstrap 产品、文档操作系统和半退役 workflow 前台
- 旧 docs 体系、旧 API、旧组件仍对 AI 理解造成噪声
- bootstrap 引擎曾长期集中在单一巨型文件中
- 缺少面向 AI 的 task / memory / code_index 闭环

## Top 10 Priority Problems

1. `AGENTS.md` 必须从长文主源收口为薄入口 bootloader
2. 旧的分层 docs 子树已经不应继续作为 live docs 使用，必须全部归档隔离
3. `scripts/compounding_bootstrap/engine.py` 过大，妨碍维护和并行修改
4. Studio 旧 workflow 页面和 API 已失效但仍残留
5. 任务系统缺失，AI 改动难以绑定明确 scope
6. 项目记忆层和 ADR 没有清晰归宿
7. code index 缺失，AI 每次都要重新摸索模块入口
8. 巨型 util / helper 扩张缺少明确治理阈值
9. 技术债没有系统化沉淀
10. 缺少自进化扫描脚本来持续生成后续任务

## Target Structure

```text
repo/
├─ AGENTS.md
├─ docs/
│  ├─ PROJECT_RULES.md
│  ├─ ARCHITECTURE.md
│  ├─ DEV_WORKFLOW.md
│  ├─ AI_OPERATING_MODEL.md
│  └─ REFACTOR_PLAN.md
├─ memory/
├─ code_index/
├─ tasks/
├─ scripts/ai/
└─ apps/studio/src/modules/
```

## Largest Files Snapshot

- `apps/studio/.next/cache/webpack/server-production/8.pack`: 738060 LOC
- `apps/studio/.next/cache/webpack/server-production/7.pack`: 714078 LOC
- `apps/studio/.next/cache/webpack/server-production/9.pack`: 520925 LOC
- `apps/studio/.next/cache/webpack/client-production/9.pack`: 450115 LOC
- `apps/studio/.next/cache/webpack/client-production/2.pack`: 449381 LOC
- `apps/studio/.next/cache/webpack/server-production/4.pack`: 429117 LOC
- `apps/studio/.next/cache/webpack/client-production/0.pack`: 376639 LOC
- `apps/studio/.next/cache/webpack/client-development/8.pack.gz`: 340303 LOC
- `apps/studio/.next/cache/webpack/server-production/0.pack`: 279182 LOC
- `apps/studio/.next/cache/webpack/server-production/5.pack`: 228625 LOC

## First Module Split Candidates

- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/portal`
- `apps/studio/src/modules/git-health`
- `scripts/compounding_bootstrap/*`

## High Risk Points

- 改文档结构时容易产生平行主源
- bootstrap 行为改动必须保持 scaffold / audit / propose / apply 对外接口稳定
- 删除旧前台时必须确保 `/` 和 `/knowledge-base` 仍能正常构建

## Refactor Boundary

- 本轮以结构升级为主，不做大面积业务重写
- 允许真实删除旧页面、旧 API、旧组件和重复逻辑
- 允许直接更新规范，只要它们正在限制当前主线效率

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
