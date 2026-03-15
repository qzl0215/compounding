---
title: ADR_001_AI_NATIVE_REPO_SKELETON
doc_role: memory
update_mode: append_only
owner_role: Foreman
status: active
source_of_truth: docs/ARCHITECTURE.md
related_docs:
  - docs/REFACTOR_PLAN.md
  - memory/project/roadmap.md
last_reviewed_at: 2026-03-15
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# ADR-001 AI-Native Repo Skeleton

## Context

仓库需要从“文档产品 + 旧 workflow 前台 + 巨型引擎”收敛为适合 AI 长期协作的结构。

## Decision

采用 `AGENTS + docs + memory + code_index + tasks + scripts/ai` 的骨架，并以 Studio 只读门户做可视化入口。

## Consequences

这让规则、状态、记忆、上下文和任务各有归宿，同时避免再建平行体系。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
