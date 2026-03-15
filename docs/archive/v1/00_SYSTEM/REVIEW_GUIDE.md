---
title: REVIEW_GUIDE
owner_role: Auditor
status: active
last_reviewed_at: 2026-03-11
source_of_truth: bootstrap/project_bootstrap.yaml
related_docs:
  - docs/00_SYSTEM/DONE_CHECKLISTS.md
  - docs/70_MEMORY/TECH_DEBT.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Review Guide

## Review Priority

1. 行为回归与边界突破
2. 规则冲突与归宿混乱
3. 证据边界缺失
4. 复杂度净增加且无收敛路径
5. 测试与审计缺口

## Required Review Questions

- 改动是否落在允许范围内？
- 是否引入了平行体系？
- 是否保留唯一 source of truth？
- 是否附带 complexity appendix？

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/00_SYSTEM/REVIEW_GUIDE.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
