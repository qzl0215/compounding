---
title: PROJECT_RULES
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-11
source_of_truth: bootstrap/project_bootstrap.yaml
related_docs:
  - docs/00_SYSTEM/ARCHITECTURE_BOUNDARIES.md
  - docs/40_EXECUTION/WORKFLOW_AUTOPILOT.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Project Rules

## Mandatory Governance Rules

- 所有规则都必须有唯一归宿。
- 不允许新建平行体系；优先复用、收敛与减法。
- Proposal 未确认前不得直接修改规范与核心治理文件。
- 高频汇报必须包含 evidence boundary 与 complexity appendix。

## Rule Precedence

1. `AGENTS.md`
2. `docs/00_SYSTEM/PROJECT_RULES.md`
3. `docs/40_EXECUTION/WORKFLOW_AUTOPILOT.md`
4. `docs/00_SYSTEM/ARCHITECTURE_BOUNDARIES.md`
5. `docs/60_TEMPLATES/*`
6. `docs/30_STRATEGY/OPPORTUNITY_POOL.md` 与 `docs/70_MEMORY/TECH_DEBT.md`

## Business Boundary Summary

- Repo kind: `software-multi-agent`
- SCM flow: `github-pr-rebase`
- Rewrite policy: `proposal-preview-confirm-apply`
- Version policy: `git-files-source-of-truth`

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/00_SYSTEM/PROJECT_RULES.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
