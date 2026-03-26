# 收口上下文即时复盘与最小上下文包

## 任务摘要

- 任务 ID：`task-077`
- 短编号：`t-077`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  收口上下文即时复盘与最小上下文包
- 为什么现在：
  当前已有 retro 摘要、feature context 和 ai efficiency，但时间浪费仍主要靠回忆发现，build-context 也仍然默认塞长正文，导致新 Agent 重复耗时和上下文膨胀继续发生
- 承接边界：
  只收口 context retro 派生链、feature/build context 默认载荷、task 级轻量成本账单与 ai efficiency / tasks / releases 看板，不新增数据库、不改 bootstrap 外部壳项目
- 完成定义：
  preflight/feature-context/build-context/ai-efficiency 已接入即时复盘与平衡型最小包，weekly retro 可聚合输出，相关测试与门禁通过

## 执行合同

### 要做

context-retro CLI、feature-context/build-context、task 级轻量成本账单、ai-efficiency / tasks / releases 数据契约与 Studio 展示、相关测试同步

补充：`tests/test_ai_context_retro.py`、`tests/test_ai_feature_context.py`、`tests/test_ai_summary_harness.py`

### 不做

自动升格 memory/experience、全局 hook、数据库、重型自动化依赖

### 约束

继续只使用 companion/activity 摘要与 output/ai/command-gain/events.jsonl；不新增第二套状态源；默认上下文模式为 balanced

### 关键风险

若即时复盘噪声过高，会把 feature-context 再次拉长；若 build-context 兼容处理不当，会破坏现有上下文消费者

### 测试策略

- 为什么测：这是上下文主链的结构性收口，必须验证 retro 触发、packet 压缩、看板聚合和既有 summary wrapper 回归
- 测什么：python3 -m unittest 相关 tests；pnpm --filter studio test/build；pnpm validate:static；pnpm preflight -- --taskId=t-077
- 不测什么：不引入数据库或自动化调度器的端到端测试
- 当前最小集理由：high

## 交付结果

- 状态：doing
- 体验验收结果：
  `preflight`、`feature-context`、`build-context` 与 `/ai-efficiency` 已接入即时复盘和 balanced packet；首页只显示高信号摘要，详情页可读 context waste / density。
- 交付结果：
  新增 `pnpm ai:context-retro` 与 `context_packet` tracking；`build-context` 默认不再拼全文，`--expanded` 才附 excerpt；Studio 服务端改为只读派生 JSON，不直接依赖脚本执行层。
- 复盘：
  这轮真正的断点不是算法，而是 UI 服务端直接 import 脚本执行层；后续类似能力应优先通过共享 contract 或派生 JSON 进入页面。

## 当前模式

工程执行

## 分支

`codex/task-077`

## 关联模块

- `scripts/ai/`
- `scripts/coord/lib/`
- `scripts/release/`
- `shared/`
- `apps/studio/src/modules/project-state/`
- `apps/studio/src/modules/portal/`
- `apps/studio/src/modules/tasks/`
- `apps/studio/src/modules/releases/`
- `apps/studio/src/app/ai-efficiency/`
- `apps/studio/src/app/tasks/`
- `apps/studio/src/app/releases/`
- `package.json`
- `tests/test_ai_context_retro.py`
- `tests/test_ai_feature_context.py`
- `tests/test_ai_summary_harness.py`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
