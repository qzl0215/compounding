---
title: ASSET_MAINTENANCE
update_mode: generated
status: active
last_reviewed_at: 2026-04-01
source_of_truth: scripts/ai/generate-asset-maintenance.ts
related_docs:
  - docs/PROJECT_RULES.md
  - docs/AI_OPERATING_MODEL.md
  - docs/prompts/prompt-assets.json
  - code_index/module-index.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 资产维护矩阵

## 当前高频资产

### Prompt 资产

- 方式：`validated`
- 真相源：`docs/prompts/prompt-assets.json`
- 入口：`pnpm validate:ai-output`
- 文件：`docs/prompts/prompt-assets.json`、`docs/prompts/ai-doc-rewrite-system.md`、`docs/prompts/ai-doc-clarify-user.md`、`docs/prompts/ai-doc-rewrite-user.md`
- 边界：Prompt 正文保持人工维护，运行时与校验器统一读取注册表。；新增或移除 prompt 时，必须同时更新 prompt-assets.json。；Prompt 变更必须支持版本回退与人工 review。

### 索引资产

- 方式：`generated`
- 真相源：`scripts/ai/generate-module-index.ts`
- 入口：`pnpm ai:generate-index`
- 文件：`code_index/module-index.md`、`code_index/dependency-map.md`、`code_index/function-index.json`
- 边界：code_index 只做导航与压缩，不承载决策、经验或当前状态。；模块边界、导出入口或函数索引变化后，应重新生成索引。；人工补充说明写回 ARCHITECTURE、module.md 或 task，不直接手改生成索引。

### 高频主干文档

- 方式：`manual`
- 真相源：`frontmatter.source_of_truth (per document)`
- 入口：`人工 review + task 回写`
- 文件：`AGENTS.md`、`docs/WORK_MODES.md`、`docs/DEV_WORKFLOW.md`、`docs/ARCHITECTURE.md`、`memory/project/roadmap.md`、`memory/project/current-state.md`、`memory/project/operating-blueprint.md`
- 新鲜度：14 天窗口；strict 模式超窗即失败
- 边界：高频主干文档保留人工维护，不把判断性内容错误生成化。；默认先读主干，再按场景补专项附录、task 和 code_index。；结构性改动时必须通过 task、memory 与相关主干文档同步回写。

### 专项附录

- 方式：`manual`
- 真相源：`frontmatter.source_of_truth (per document)`
- 入口：`人工 review + task 回写`
- 文件：`docs/PROJECT_RULES.md`、`docs/AI_OPERATING_MODEL.md`、`docs/ASSET_MAINTENANCE.md`、`memory/project/tech-debt.md`
- 新鲜度：21 天窗口；超窗默认警告
- 边界：专项附录只在对应场景补读，不回到默认第一跳。；附录负责专项规则、AI 行为原则和资产维护，不与主干争主入口。；若附录与主干冲突，先更新主干，再调整附录。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
