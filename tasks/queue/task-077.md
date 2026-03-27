# 收口上下文成本账单、task 分支回收与 GitHub 接入准备

## 任务摘要

- 任务 ID：`task-077`
- 短编号：`t-077`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  收口上下文即时复盘、轻量成本账单、task 分支回收闭环，并补齐 GitHub remote 接入前的最小 readiness 视图
- 为什么现在：
  当前已有 retro 摘要、feature context 和 ai efficiency，但时间浪费仍主要靠回忆发现，build-context 也仍然默认塞长正文；同时 task 分支长期残留、回收状态全靠人工判断，而 GitHub remote 仍未接入，导致远端回收、真实 sync 检查和 release tag 前提都没有明确闭环
- 承接边界：
  只收口 context retro 派生链、feature/build context 默认载荷、task 级轻量成本账单、task 分支回收状态机、GitHub remote readiness 摘要与 ai efficiency / tasks / releases / project-state 看板，不新增数据库、不改 bootstrap 外部壳项目
- 完成定义：
  preflight/feature-context/build-context/ai-efficiency 已接入即时复盘与平衡型最小包，weekly retro 可聚合输出；task 分支回收的 schedule/backfill/report/cleanup 闭环、release 触发、Studio 只读投影、GitHub remote readiness 摘要与相关测试全部通过

## 执行合同

### 要做

context-retro CLI、feature-context/build-context、task 级轻量成本账单、task 分支回收状态机与 CLI、release hook、GitHub remote readiness 摘要与 operator runbook、ai-efficiency / tasks / releases / project-state 数据契约与 Studio 展示、相关测试同步

补充：`tests/test_ai_context_retro.py`、`tests/test_ai_feature_context.py`、`tests/test_ai_summary_harness.py`、`tests/test_coord_cli.py`、`tests/test_ai_assets_cli.py`

### 不做

自动升格 memory/experience、全局 hook、数据库、重型自动化依赖、未经明确仓库坐标授权的真实 remote 接入

### 约束

继续只使用 companion/activity 摘要与 `output/ai/command-gain/events.jsonl`；task 分支回收真相只放 companion，不新增第二套状态源；默认上下文模式为 balanced；GitHub readiness 只输出缺口和最小步骤，不猜 owner/repo

### 关键风险

若即时复盘噪声过高，会把 feature-context 再次拉长；若 build-context 兼容处理不当，会破坏现有上下文消费者；若分支回收状态机和 Git 校验口径不一致，会把已删分支重新判成 drift；若 remote readiness 和 operator contract 口径不一致，会把“未启用”误报成失败

### 测试策略

- 为什么测：这是上下文与交付治理主链的结构性收口，必须验证 retro 触发、packet 压缩、成本账单、分支回收状态机、GitHub readiness、看板聚合和既有 summary wrapper 回归
- 测什么：`python3 -m unittest` 相关 tests；`pnpm --filter studio test/build`；`pnpm validate:static`；`pnpm preflight -- --taskId=t-077`
- 不测什么：不引入数据库、远端仓库或自动化调度器的端到端测试
- 当前最小集理由：high

## 交付结果

- 状态：已完成
- 体验验收结果：
  `preflight`、`feature-context`、`build-context` 与 `/ai-efficiency` 已接入即时复盘和 balanced packet；首页只显示高信号摘要，详情页可读 context waste / density。
- 交付结果：
  新增 `pnpm ai:context-retro` 与 `context_packet` tracking；`build-context` 默认不再拼全文，`--expanded` 才附 excerpt；Studio 服务端改为只读派生 JSON，不直接依赖脚本执行层；task 分支回收补齐 `backfill/report/cleanup` 命令、release 触发与任务页/首页只读治理提示；并新增 `pnpm ai:github-surface:summary`，让 GitHub remote 接入前可先看到还差哪一步。
  补充收口：`bootstrap/project_operator.yaml` 的 `github_surface.notes` 已改成简化 YAML 解析器稳定可读的纯文本说明，避免 audit 把摘要说明误判成对象。
  功能收口：回合级 `turn-report` 已移除；当前仓只保留 `command-gain / ai-efficiency` 这类可解释的 summary/context 指标，不再输出伪装成“本轮总 token”的回执。
- 复盘：
  这轮真正的断点不是算法，而是 UI 服务端直接 import 脚本执行层，以及缺少一个能把 remote 缺口说清楚的 repo-native 摘要；后续类似能力应优先通过共享 contract 或派生 JSON 进入页面。

## 当前模式

发布复盘

## 分支

`codex/task-077`

## 关联模块

- `bootstrap/project_operator.yaml`
- `scripts/ai/`
- `scripts/coord/`
- `scripts/coord/lib/`
- `scripts/release/`
- `shared/`
- `docs/AI_OPERATING_MODEL.md`
- `docs/DEV_WORKFLOW.md`
- `docs/ASSET_MAINTENANCE.md`
- `docs/OPERATOR_RUNBOOK.md`
- `CLAUDE.md`
- `OPENCODE.md`
- `.cursor/rules/00-project-entry.mdc`
- `apps/studio/src/modules/project-state/`
- `apps/studio/src/modules/portal/`
- `apps/studio/src/modules/tasks/`
- `apps/studio/src/modules/releases/`
- `apps/studio/src/app/ai-efficiency/`
- `apps/studio/src/app/tasks/`
- `apps/studio/src/app/releases/`
- `agent-coordination/tasks/`
- `package.json`
- `tests/test_ai_context_retro.py`
- `tests/test_ai_feature_context.py`
- `tests/test_ai_summary_harness.py`
- `tests/coord_support.py`
- `tests/test_coord_cli.py`
- `tests/test_ai_assets_cli.py`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
