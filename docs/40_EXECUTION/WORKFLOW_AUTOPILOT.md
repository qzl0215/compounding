---
title: WORKFLOW_AUTOPILOT
owner_role: Architect
status: active
last_reviewed_at: 2026-03-11
source_of_truth: bootstrap/project_bootstrap.yaml
related_docs:
  - docs/50_SOP/PLAN_EXECUTE_REVIEW_SOP.md
  - docs/00_SYSTEM/PROJECT_RULES.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Workflow Autopilot

## Default Flow

1. Read-only inventory
2. Define target and acceptance check
3. Implement minimum viable change
4. Run audit or tests
5. Report using fixed structure
6. Harden long-term knowledge if repeated

## Proposal-Gated Flow

`input -> proposal -> diff -> approval -> apply -> git commit`

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/40_EXECUTION/WORKFLOW_AUTOPILOT.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
