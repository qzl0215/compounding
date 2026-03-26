# 扩展高频摘要覆盖并落地令牌效率看板

## 任务摘要

- 任务 ID：`task-074`
- 短编号：`t-074`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  扩展高频摘要覆盖并落地令牌效率看板
- 为什么现在：
  把高ROI摘要覆盖扩到读仓与差异类高噪音场景，并把令牌消耗与节省结果可视化，直接提升AI开发效率与可感知性
- 承接边界：
  仅扩展repo-native摘要wrapper、command-gain聚合与Studio看板，不改全局hook与用户环境
- 完成定义：
  新增高ROI摘要wrapper并输出统一看板契约，Studio可查看令牌消耗与节省摘要，相关静态与测试门禁通过

## 执行合同

### 要做

- `shared/ai-efficiency.ts`
- `scripts/ai/diff-summary.ts`
- `scripts/ai/tree-summary.ts`
- `scripts/ai/lib/command-gain.ts`
- `scripts/ai/lib/summary-harness.ts`
- `scripts/ai/lib/summary-profiles.ts`
- `scripts/ai/lib/operator-contract.ts`
- `apps/studio/src/app/ai-efficiency/`
- `apps/studio/src/modules/project-state/`
- `apps/studio/src/modules/portal/`
- `bootstrap/project_operator.yaml`
- `docs/OPERATOR_RUNBOOK.md`
- `CLAUDE.md`
- `OPENCODE.md`
- `.cursor/rules/00-project-entry.mdc`
- `kernel/kernel_manifest.yaml`
- `package.json`
- `tests/test_ai_summary_harness.py`
- `tests/test_ai_assets_cli.py`

### 不做

全局shell代理、home目录配置、SQLite与遥测

### 约束

保持单一tracking数据源，尽量复用现有project-state与command-gain实现

### 关键风险

若read/find/tree/diff策略过重，可能引入噪音或过度裁剪，需要先做最小profile并用fixture约束

### 测试策略

- 为什么测：这是结构性能力扩展，需验证wrapper、看板契约与Studio显示一致
- 测什么：python3 -m unittest相关tests；pnpm ai:validate:static:summary；必要的studio test/build
- 不测什么：
- 当前最小集理由：高，直接影响AI效率覆盖面和量化可视化

## 交付结果

- 状态：已完成
- 体验验收结果：
  首页已能直接看到 AI Efficiency 摘要，并新增独立详情页承接令牌消耗、节省与 adoption。
- 交付结果：
  已补 `diff_summary` 与 `tree_summary` 两个 phase 1.5 高ROI wrapper，并把 `command-gain` 扩成可直接供 Studio 消费的 dashboard contract。
- 复盘：
  `diff_summary` 与 `tree_summary` 需要优先信任结构化摘要本身，过度叠加通用文本策略反而会损失可读性。

## 当前模式

工程执行

## 分支

`codex/task-074`

## 关联模块



## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：changed: 更新了 OPERATOR_RUNBOOK 与跨工具入口，新增 AI Efficiency 页面入口说明
