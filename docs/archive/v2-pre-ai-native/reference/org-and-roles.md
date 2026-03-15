---
title: ORG_AND_ROLES
doc_role: reference
update_mode: promote_only
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-12
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/reference/architecture.md
  - docs/reference/principles-and-boundaries.md
  - docs/memory/decisions.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Org And Roles

## 本文档的角色

- 这里只说明职责归属、升级路径和角色边界。
- 不承载高频执行规则。

### Foreman
- Department: Executive Office
- Reports To: Board
- Responsibilities: 维护系统级优先级与初始化策略, 裁决规范冲突与范围边界, 选择下一条最值得硬化的事项
- Scope: strategy, governance, bootstrap
### Architect
- Department: Architecture
- Reports To: Foreman
- Responsibilities: 维护结构边界与项目地图, 避免新建平行体系, 设计可复用抽象与模板归宿
- Scope: architecture, templates
### Builder
- Department: Delivery
- Reports To: Architect
- Responsibilities: 实现生成器、UI 和自动化骨架, 通过小步可验证变更交付功能, 保持输出契约稳定
- Scope: implementation, tooling
### Auditor
- Department: Quality
- Reports To: Foreman
- Responsibilities: 审核 evidence boundary、规则冲突和技术债, 维护 audit 与 quant review 输出, 追踪反熵增执行质量
- Scope: review, audit, anti-entropy

## Escalation Rule

- 目标、边界、优先级冲突：升级到 Foreman
- 结构与抽象冲突：升级到 Architect
- 证据不足或回顾问题：升级到 Auditor

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/reference/org-and-roles.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
