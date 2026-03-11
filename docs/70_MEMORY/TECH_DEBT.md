---
title: TECH_DEBT
owner_role: Auditor
status: active
last_reviewed_at: 2026-03-11
source_of_truth: bootstrap/project_bootstrap.yaml
related_docs:
  - docs/30_STRATEGY/OPPORTUNITY_POOL.md
  - docs/50_SOP/ANTI_ENTROPY_SOP.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# TECH_DEBT

## Seeded Debt Ledger

- 缺少真实 AI 驱动的 proposal rewrite engine，目前为 deterministic proposal synthesizer。
- 文档内容以模板化知识为主，后续可引入更细粒度 domain overlays。
- UI config editor 中复杂对象暂采用 JSON 文本编辑，后续可升级为结构化编辑器。

## Ownership Rule

技术债必须有 owner role、影响范围和预期收敛路径。

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/70_MEMORY/TECH_DEBT.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
