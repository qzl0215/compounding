---
title: ORG_MODEL
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-12
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/OPERATING_RULES.md
  - docs/MEMORY_LEDGER.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Org Model

## 本文档的角色

这是低频参考文档。
只有当任务涉及职责归属、升级路径或角色边界时才需要补读。

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

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/ORG_MODEL.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
