---
title: VALIDATION_MODES
owner_role: Auditor
status: active
last_reviewed_at: 2026-03-11
source_of_truth: bootstrap/project_bootstrap.yaml
related_docs:
  - docs/40_EXECUTION/WORKFLOW_AUTOPILOT.md
  - docs/00_SYSTEM/DONE_CHECKLISTS.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Validation Modes

- `prod-live`
- `local-code-prod-data`
- `full-local`

## Mode Selection

- `prod-live`: 服务器为唯一真相
- `local-code-prod-data`: 本地改代码，验证依赖真实数据
- `full-local`: 仅用于低风险闭环与快速反馈

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/40_EXECUTION/VALIDATION_MODES.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
