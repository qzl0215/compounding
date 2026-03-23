---
title: ARCHITECTURE_BOUNDARIES
status: active
last_reviewed_at: 2026-03-11
source_of_truth: bootstrap/project_bootstrap.yaml
related_docs:
  - docs/00_SYSTEM/PROJECT_MAP.md
  - docs/40_EXECUTION/RISK_ACTIONS_AND_GUARDS.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Architecture Boundaries

## Runtime Boundary

项目当前采用 `server-only`。任何实现都必须显式说明本地证据、服务器真实证据和适用边界。

## Allowed Scopes

- apps/studio/**
- bootstrap/**
- docs/**
- scripts/**
- tests/**
- .github/workflows/**

## Frozen Items

- 不引入数据库
- 不做多租户
- 不做真实 agent runtime orchestration

## High Risk Actions

- 未经确认直接重写规范库
- 引入平行规则体系
- 跳过 evidence boundary 做结论

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/00_SYSTEM/ARCHITECTURE_BOUNDARIES.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
