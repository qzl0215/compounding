# 把摘要优先工作流做成默认入口

## 任务摘要

- 任务 ID：`task-076`
- 短编号：`t-076`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把摘要优先工作流做成默认入口，并收口 bootstrap shell 的分类口径，同时补齐老项目/新项目接入 checklist
- 为什么现在：
  上一轮已经把摘要 wrapper 和量化看板打通了，但默认工作流还缺统一的可见入口与单一常量，导致 adoption 仍然需要手工记忆；同时 bootstrap 复制到新壳项目的 ARCHITECTURE / document manifest 口径还需要和黄金实例统一，这轮要把默认摘要链收成共享入口并同步外化分类口径，推动真实采用和跨项目一致性
- 承接边界：
 只统一摘要优先默认链、bootstrap shell 分类口径与可见入口，不新增 wrapper、不改 tracking 数据源、不引入新状态源
- 完成定义：
  摘要优先默认命令收成共享常量，Studio AI Efficiency 和 operator runbook 都展示同一默认链，相关测试与静态门禁通过

## 执行合同

### 要做

shared/ai-efficiency.ts,scripts/ai/lib/feature-context.ts,scripts/ai/lib/operator-contract.ts,apps/studio/src/modules/project-state/components/ai-efficiency-card.tsx,apps/studio/src/modules/project-state/__tests__/ai-efficiency-card.test.tsx,apps/studio/src/modules/portal/components/home-logic-board.tsx,apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx,docs/OPERATOR_RUNBOOK.md,tests/test_ai_summary_harness.py,tests/test_ai_assets_cli.py

补充：`docs/ARCHITECTURE.md`、`memory/architecture/system-overview.md`、`memory/project/current-state.md`、`memory/project/operating-blueprint.md`、`memory/project/roadmap.md`、`bootstrap/templates/document_manifest.json`、`scripts/compounding_bootstrap/bootstrap.py`、`scripts/compounding_bootstrap/scaffold_assets.py`、`tests/test_bootstrap_scaffold_cli.py`

### 不做

新增 wrapper、数据库、全局 hook、AST 解析器、客户端轮询

### 约束

继续只使用 events.jsonl 作为 tracking 数据源；默认链和 fallback 链必须来自同一共享定义

### 关键风险

如果默认链只在文档里出现而没进入 UI 和共享常量，adoption 依然会停在记忆层

### 测试策略

- 为什么测：这是 adoption 提升的结构性改动，需要验证共享常量、Studio 展示和 operator 入口一致
- 测什么：python3 -m unittest 相关 tests；pnpm ai:generate-operator-assets；必要的 studio test/build；pnpm ai:validate:static:summary
- 不测什么：
- 当前最小集理由：高

## 交付结果

- 状态：已完成
- 体验验收结果：
  摘要优先默认链现在同时出现在 feature-context、AI Efficiency 卡片、首页逻辑板和 operator runbook，默认入口不再依赖人工记忆。
- 交付结果：
  已把 summary-first 默认工作流抽成共享定义，并同步到 Studio 可见入口、operator 资产生成链、bootstrap shell 分类口径和 onboarding checklist。
- 复盘：
  adoption 提升的关键不是继续加 wrapper，而是把默认链做成同一份共享常量并让人和 AI 在相同入口里看到它。

## 当前模式

发布复盘

## 分支

`codex/task-076`

## 关联模块



## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
