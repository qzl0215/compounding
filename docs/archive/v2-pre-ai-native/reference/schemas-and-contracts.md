---
title: SCHEMAS_AND_CONTRACTS
doc_role: reference
update_mode: promote_only
status: active
last_reviewed_at: 2026-03-12
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/reference/execution-system.md
  - docs/operations/reporting-contract.md
  - docs/planning/roadmap.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Schemas And Contracts

## Canonical Inputs

- `bootstrap/project_brief.yaml`
  - `project_name`
  - `project_one_liner`
  - `success_definition`
  - `current_priority`
  - `must_protect`
  - `runtime_boundary`

## Derived Artifacts

- `output/bootstrap/project_bootstrap.resolved.yaml`
- `output/agent_session/latest_pre_mutation_check.json`
- `output/proposals/<proposal-id>/metadata.json`

## Preflight Output

- `branch`
- `head_sha`
- `has_remote`
- `has_upstream`
- `worktree_clean`
- `sync_status`
- `next_action`

## Report Contract

高频汇报必须包含：

- `本地离线证据`
- `服务器真实证据`
- `当前结论适用边界`
- `复杂度收支附录`

## Proposal Contract

- `action_type`
- `target_blocks`
- `validation_summary`
- `base_revision`
- `apply_commit_message`

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/reference/schemas-and-contracts.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
