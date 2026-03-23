---
title: CHANGE_MANAGEMENT_SOP
status: active
last_reviewed_at: 2026-03-11
source_of_truth: bootstrap/project_bootstrap.yaml
related_docs:
  - docs/00_SYSTEM/DECISIONS.md
  - docs/60_TEMPLATES/workorder_template_execute.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Change Management SOP

## Proposal Lifecycle

1. 输入补充说明
2. 生成候选文件与 unified diff
3. 给出风险说明与 commit message
4. 人工确认后 apply
5. 将变更纳入 evolution log

## Apply Rule

未确认的 proposal 只能存在于 `output/proposals/`，不得直接污染规范库。



## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/50_SOP/CHANGE_MANAGEMENT_SOP.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
