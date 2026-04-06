---
title: 派生产物语义收口：统一主合同设计
task_id: task-098
type: structural
status: in_progress
parent_plan: memory/project/goals.md
delivery_track: direct_merge
---

## 任务摘要

当前仓库对 `code_index`、`output`、`agent-coordination`、`.compounding-runtime` 的语义仍分散在多处脚本和文档里，已经影响变更判断和回灌边界，需要收口成单一机器合同。

## 为什么现在

当前仓库对 `code_index`、`output`、`agent-coordination`、`.compounding-runtime` 的语义仍分散在多处脚本和文档里，已经影响变更判断和回灌边界，需要收口成单一机器合同。

## 承接边界

只收 code_index / output / coordination / runtime 的语义，不碰首页、任务页、发布页 snapshot UI。

## 要做

- `kernel/derived-asset-contract.yaml` 作为唯一派生产物语义合同
- 共享解析器统一从合同读取 truth role / freshness / ignore-as-truth
- 相关脚本与 validator 接入合同消费端
- 知识资产投影更新

## 不做

- 不重做 snapshot UI
- 不扩大到 task 状态机
- 不批量迁移历史产物

## 完成定义

- `kernel/derived-asset-contract.yaml` 成为唯一派生产物语义合同
- 静态门禁 `pnpm validate:derived-asset-contract` 通过
- `pnpm ai:validate-assets` 不再误报 derived asset 目录

## 关键风险

如果合同口径与现有脚本忽略规则不一致，会把历史输出或运行态误判为主源。

## 测试策略

- 测什么：`pnpm ai:validate-derived-asset-contract`；相关 Python 测试
- 不测什么：不做 snapshot UI 改版，不批量迁移历史产物

## 交付结果

派生产物语义已统一为 `kernel/derived-asset-contract.yaml` 单一合同，`code_index / output / coordination / runtime` 四大家族的 truth role、可写性与回灌边界已明确。

## 回写说明

已回写 `memory/project/current-state.md`，更新派生产物语义状态。

## 关联模块

- `AGENTS.md`
- `docs/AI_OPERATING_MODEL.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSET_MAINTENANCE.md`
- `memory/project/current-state.md`
- `memory/project/goals.md`
- `scripts/ai/generate-code-volume.ts`
- `scripts/ai/lib/change-policy.ts`
- `scripts/ai/lib/cleanup-candidates.ts`
- `scripts/ai/lib/knowledge-assets.ts`
- `scripts/ai/validate-derived-asset-contract.ts`
- `scripts/coord/scan.ts`
- `shared/derived-asset-contract.ts`
- `shared/task-contract.ts`
- `kernel/derived-asset-contract.yaml`
- `schemas/derived-asset-contract.schema.yaml`

## 治理绑定

- 主治理差距：`GOV-GAP-06`
- 来源断言：`A11`
- 回写目标：`Current`
