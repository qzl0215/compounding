# 把摘要优先工作流做成默认入口

## 任务摘要

- 任务 ID：`task-076`
- 短编号：`t-076`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把摘要优先工作流做成默认入口
- 为什么现在：
  上一轮已经把摘要 wrapper 和量化看板打通了，但默认工作流还缺统一的可见入口与单一常量，导致 adoption 仍然需要手工记忆；这轮要把默认摘要链收成共享入口并露到 Studio 与 operator 入口，推动真实采用
- 承接边界：
  只统一摘要优先默认链与可见入口，不新增 wrapper、不改 tracking 数据源、不引入新状态源
- 完成定义：
  摘要优先默认命令收成共享常量，Studio AI Efficiency 和 operator runbook 都展示同一默认链，相关测试与静态门禁通过

## 执行合同

### 要做

shared/ai-efficiency.ts,scripts/ai/lib/feature-context.ts,scripts/ai/lib/operator-contract.ts,apps/studio/src/modules/project-state/components/ai-efficiency-card.tsx,apps/studio/src/modules/project-state/__tests__/ai-efficiency-card.test.tsx,apps/studio/src/modules/portal/components/home-logic-board.tsx,apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx,docs/OPERATOR_RUNBOOK.md,tests/test_ai_summary_harness.py

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

- 状态：
- 体验验收结果：
  
- 交付结果：
  
- 复盘：
  

## 当前模式

工程执行

## 分支

`codex/task-076`

## 关联模块



## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
