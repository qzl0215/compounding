---
title: PROJECT_RULES
doc_role: reference
update_mode: promote_only
owner_role: Architect
status: active
last_reviewed_at: 2026-03-15
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/ARCHITECTURE.md
  - memory/project/tech-debt.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# PROJECT_RULES

## Goal

这份文档定义当前仓库的代码治理规则。目标不是增加流程，而是降低 AI 理解成本、降低重复逻辑和隐式依赖、稳定支撑多 agent 并行。

## File Size Limits

- TypeScript / TSX / Python 文件软上限：250 LOC
- TypeScript / TSX / Python 文件硬上限：400 LOC
- 超过软上限时，必须在任务或技术债中写明拆分计划
- 超过硬上限时，不允许继续扩张，必须进入 task queue 或 `memory/project/tech-debt.md`

## Module Boundary Rules

- 每个一等模块只做一件事
- 模块必须通过明确 public API 对外暴露能力
- 禁止跨模块直接访问内部私有实现
- `apps/studio/src/modules/*` 与 `scripts/compounding_bootstrap/*` 是当前第一批高价值模块域

## Naming Governance

- 除非有极明确边界，不允许新增以下名字作为核心承载层：`utils`、`helpers`、`common`、`misc`、`temp`、`final`、`new`、`v2`
- 模块名优先使用能力名，不用历史性或阶段性名字
- 兼容层必须在名字或文档中明确写出删除条件

## Change Contract

- 新增代码必须伴随清理
- 替代旧逻辑时，必须删除旧逻辑、或在技术债中写明兼容层和删除计划
- 任何结构性改动都必须同步更新 `task`、`memory`、`code_index`
- 规则若限制主线效率，可直接更新，但必须同步回 `AGENTS.md`、相关文档和 ADR

## Legacy Compatibility Rule

- 旧 workflow 前台、旧 API、旧 docs 树不允许再作为 live 结构继续扩张
- 必须收敛到 `AGENTS + docs + memory + code_index + tasks`
- 需要保留的过渡逻辑必须写入 `memory/project/tech-debt.md`

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
