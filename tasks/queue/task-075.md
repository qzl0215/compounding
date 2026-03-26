# 扩展默认摘要入口并补齐读仓覆盖

## 任务摘要

- 任务 ID：`task-075`
- 短编号：`t-075`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  扩展默认摘要入口并补齐读仓覆盖
- 为什么现在：
  把summary-first真正提升为默认AI入口，并把高频读仓噪音补齐到查找与读取场景，让令牌效率看板能直接指导下一步优化
- 承接边界：
  仅扩展repo-native summary wrapper、feature-context默认流、command-gain看板契约与Studio展示，不改全局hook与用户环境
- 完成定义：
  feature-context输出summary-first默认命令，新增find/read摘要wrapper，AI效率看板新增coverage和趋势字段，相关静态与测试门禁通过

## 执行合同

### 要做

- `tasks/queue/task-075.md`
- `scripts/ai/feature-context.ts`
- `scripts/ai/find-summary.ts`
- `scripts/ai/read-summary.ts`
- `scripts/ai/command-gain.ts`
- `scripts/ai/generate-operator-assets.ts`
- `scripts/ai/lib/feature-context.ts`
- `scripts/ai/lib/summary-harness.ts`
- `scripts/ai/lib/summary-profiles.ts`
- `scripts/ai/lib/command-gain.ts`
- `scripts/ai/lib/operator-contract.ts`
- `shared/ai-efficiency.ts`
- `bootstrap/project_operator.yaml`
- `kernel/kernel_manifest.yaml`
- `package.json`
- `docs/OPERATOR_RUNBOOK.md`
- `CLAUDE.md`
- `OPENCODE.md`
- `.cursor/rules/00-project-entry.mdc`
- `apps/studio/src/app/ai-efficiency/`
- `apps/studio/src/modules/project-state/`
- `apps/studio/src/modules/portal/`
- `tests/test_ai_feature_context.py`
- `tests/test_ai_summary_harness.py`
- `tests/test_ai_assets_cli.py`
- `tests/test_bootstrap_scaffold_cli.py`

### 不做

全局shell代理、数据库、客户端轮询、AST解析器

### 约束

继续只使用events.jsonl作为tracking数据源，保持repo-native和轻量parser

### 关键风险

若read摘要规则过度推断，容易重新长出解释层，因此只允许结构提取和原文回退

### 测试策略

- 为什么测：这是结构性效率增强，需验证wrapper、dashboard契约、Studio显示和bootstrap导出一致
- 测什么：python3 -m unittest相关tests；pnpm ai:validate:static:summary；必要的studio test/build
- 不测什么：
- 当前最小集理由：高，直接影响默认AI入口效率、覆盖面和看板可决策性

## 交付结果

- 状态：进行中
- 体验验收结果：
  AI 默认入口现在会显式给出 summary-first commands 与 raw fallback commands；Studio `/ai-efficiency` 页面已经能同时回答覆盖面、趋势变化和任务级耗用，不再只看总节省。
- 交付结果：
  已新增 `find_summary` 与 `read_summary` 两个 repo-native wrapper，`command-gain` dashboard 已补 `coverage / trend_delta / task_rollups`，operator assets 与 `ai_exec_pack` 也已同步到新的 summary-first 默认入口。
- 复盘：
  高 ROI 改进的关键不在再加新过滤器，而在把默认入口、量化追踪和导出资产维持成同一条链；一旦 feature-context 和 operator entry 先把摘要链摆在前面，adoption 才有机会继续上升。

## 当前模式

工程执行

## 分支

`codex/task-075`

## 关联模块

- `package.json`
- `scripts/ai/`
- `shared/ai-efficiency.ts`
- `apps/studio/src/app/ai-efficiency/`
- `apps/studio/src/modules/project-state/`
- `apps/studio/src/modules/portal/`
- `bootstrap/project_operator.yaml`
- `docs/OPERATOR_RUNBOOK.md`
- `CLAUDE.md`
- `OPENCODE.md`
- `.cursor/rules/00-project-entry.mdc`
- `kernel/kernel_manifest.yaml`
- `tests/test_ai_feature_context.py`
- `tests/test_ai_summary_harness.py`
- `tests/test_ai_assets_cli.py`
- `tests/test_bootstrap_scaffold_cli.py`


## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：changed: 更新了 OPERATOR_RUNBOOK 与跨工具入口，补充了默认摘要链和 AI Efficiency 详情页入口
