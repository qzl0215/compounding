---
title: COMPOUNDING_SYSTEM
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-11
source_of_truth: bootstrap/project_bootstrap.yaml
related_docs:
  - docs/00_SYSTEM/PROJECT_RULES.md
  - docs/40_EXECUTION/WORKFLOW_AUTOPILOT.md
  - docs/80_AUTOMATION/FOREMAN_BOOTSTRAP_PROMPT.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Compounding AI Operating System

## System Intent

在任意新项目中快速初始化一套以虚拟公司治理为核心的 AI Operating System，持续产生复利并抑制熵增。

## Canonical Entry Order

1. `docs/00_SYSTEM/PROJECT_RULES.md`
2. `docs/00_SYSTEM/PROJECT_MAP.md`
3. `docs/00_SYSTEM/ARCHITECTURE_BOUNDARIES.md`
4. `docs/40_EXECUTION/WORKFLOW_AUTOPILOT.md`
5. `docs/60_TEMPLATES/*`
6. `docs/70_MEMORY/*`

## Project Facts

- Runtime boundary: `server-only`
- North star metric: 新项目在首轮初始化后，任意 agent 只读 COMPOUNDING_SYSTEM 即能在不增加平行体系的情况下安全迭代。
- Current primary goals:
- 建立可跨项目复用的初始化框架
- 提供高科技感且高信息密度的配置与知识阅读界面
- 以 Git 文件作为规范与版本真相源
- Current primary chains:
- bootstrap schema -> scaffold -> audit -> proposal -> apply
- docs knowledge base -> studio visibility -> anti-entropy iteration
- Allowed scopes:
- apps/studio/**
- bootstrap/**
- docs/**
- scripts/**
- tests/**
- .github/workflows/**
- Frozen items:
- 不引入数据库
- 不做多租户
- 不做真实 agent runtime orchestration

## Enabled Modules

- `ui_system`: enabled
- `server_truth_ledger`: enabled
- `quant_review`: enabled
- `evidence_boundary`: enabled
- `anti_entropy`: enabled
- `tech_debt`: enabled

## Next Hardening Target

完成 bootstrap schema、CLI 与模板资产



## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/00_SYSTEM/COMPOUNDING_SYSTEM.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
