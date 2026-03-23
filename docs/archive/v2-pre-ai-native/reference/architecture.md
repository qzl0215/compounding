---
title: ARCHITECTURE_REFERENCE
doc_role: reference
update_mode: promote_only
status: active
last_reviewed_at: 2026-03-12
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/reference/execution-system.md
  - docs/reference/org-and-roles.md
  - docs/planning/roadmap.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Architecture

## 本文档的角色

- 本文档只保留稳定的系统结构、目录边界和 live/archived 文档分层。
- 高频执行规则仍以 `AGENTS.md` 为准。

## Live 文档拓扑

- `AGENTS.md`：唯一高频执行主源
- `docs/reference/*`：稳定知识
- `docs/operations/*`：格式与模板
- `docs/memory/*`：经验与决策中转
- `docs/planning/*`：当前阶段排序
- `docs/archive/v1/*`：旧 V1 历史归档

## Repo Snapshot

- 主要语言：Markdown, Python, TypeScript
- 包管理器：pnpm
- Build Command：`pnpm build`
- Test Command：`pnpm test`

## Main Directories

- `apps`
- `tests`

## Lanes

- `apps` -> `apps/**`
- `tests` -> `tests/**`

## Hot Files

- `AGENTS.md`
- `README.md`
- `package.json`
- `bootstrap/project_brief.yaml`

## Archive Policy

- 旧编号体系文档和上一代 live docs 一律进入 `docs/archive/v1/`
- archive 只保留历史价值，不再继续更新

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/reference/architecture.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
