---
title: ASSET_MAINTENANCE
doc_role: reference
update_mode: generated
status: active
last_reviewed_at: 2026-03-17
source_of_truth: scripts/ai/generate-asset-maintenance.ts
related_docs:
  - docs/PROJECT_RULES.md
  - docs/AI_OPERATING_MODEL.md
  - docs/prompts/prompt-assets.json
  - code_index/module-index.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 资产维护矩阵

## 三分法

- `generated`：由脚本生成，人不直接手改生成产物。
- `validated`：正文人工维护，但运行时与校验器共用注册表或结构检查。
- `manual`：保留人工维护，通过 task 回写和 review 控制质量。

## 当前高频资产

### Prompt 资产

- 维护方式：`validated`
- 真相源：`docs/prompts/prompt-assets.json`
- 入口命令：`pnpm validate:ai-output`
- 资产文件：
  - `docs/prompts/prompt-assets.json`
  - `docs/prompts/ai-doc-rewrite-system.md`
  - `docs/prompts/ai-doc-clarify-user.md`
  - `docs/prompts/ai-doc-rewrite-user.md`
- 边界：
  - Prompt 正文保持人工维护，运行时与校验器统一读取注册表。
  - 新增或移除 prompt 时，必须同时更新 prompt-assets.json。
  - Prompt 变更必须支持版本回退与人工 review。

### 索引资产

- 维护方式：`generated`
- 真相源：`scripts/ai/generate-module-index.ts`
- 入口命令：`pnpm ai:generate-index`
- 资产文件：
  - `code_index/module-index.md`
  - `code_index/dependency-map.md`
  - `code_index/function-index.json`
- 边界：
  - code_index 只做导航与压缩，不承载决策、经验或当前状态。
  - 模块边界、导出入口或函数索引变化后，应重新生成索引。
  - 人工补充说明写回 ARCHITECTURE、module.md 或 task，不直接手改生成索引。

### 关键说明文档

- 维护方式：`manual`
- 真相源：`frontmatter.source_of_truth (per document)`
- 入口命令：`人工 review + task 回写`
- 资产文件：
  - `AGENTS.md`
  - `docs/PROJECT_RULES.md`
  - `docs/DEV_WORKFLOW.md`
  - `docs/AI_OPERATING_MODEL.md`
  - `memory/project/current-state.md`
- 边界：
  - 关键说明文档保留人工维护，不把判断性内容错误生成化。
  - 结构性改动时必须通过 task、memory 与相关文档同步回写。
  - 若规则与现实冲突，先更新主源，再调整执行链路。

## 默认维护原则

- 先明确真相源，再决定生成、校验或人工维护。
- 生成产物不承载判断性内容；判断性内容继续留在人工主源。
- 只有高频、高漂移且易校验的资产，才优先进入防漂移机制。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
