---
title: OPERATING_RULES
owner_role: Architect
status: active
last_reviewed_at: 2026-03-11
source_of_truth: bootstrap/project_brief.yaml
related_docs:
  - docs/PROJECT_CARD.md
  - docs/PLAYBOOK.md
  - docs/ORG_MODEL.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Operating Rules

## 用户需要知道的少数规则

- 系统会自动把项目说明、保护边界和 review 要求拼进 agent brief。
- 实质性改动默认先进入 Reviews，再确认落盘。
- 项目规范以 Git 中的文件为准，不依赖聊天上下文记忆。
- 当证据不足时，系统应先降级结论范围，而不是扩张判断。

## 系统自动执行的内核规则

- 所有规则都必须有唯一归宿
- 默认采用 proposal-preview-confirm-apply
- 新增结构必须解释如何创造复利
- 所有报告默认区分本地证据与服务器证据

## 默认审批法则

- 所有 proposal 默认需要人工确认。
- 高风险变更必须保留 touched files、risk 和 diff excerpt。
- 若工作区脏、HEAD 漂移或目标 block 漂移，则拒绝 apply。

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/OPERATING_RULES.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
