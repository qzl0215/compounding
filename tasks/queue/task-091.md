# 首轮删除废壳并收短展示链

## 任务摘要

- 任务 ID：`task-091`
- 短编号：`t-091`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  首轮删除废壳并收短展示链
- 为什么现在：
  当前仓库存在未接入主路径的废模块、重复投影字段和重复展示页面，继续保留只会放大理解成本与维护面。
- 承接边界：
  只处理高把握的首轮瘦身：删除无引用模块，移除无消费重复投影，收短 AI 效率与控制面展示壳层，不改核心任务、发布、知识库主链。
- 完成定义：
  git-health 模块退出仓内主路径；orchestration 不再重复投影 controlPlane；AI 效率与控制面页面代码显著收短且现有核心页面仍可读取同一快照。
- 交付轨道：`direct_merge`

## 执行合同

### 要做

- 删除无引用的 git-health 模块及其残余引用\n- 移除 orchestration 里无消费的 controlPlane 冗余投影\n- 收短 /ai-efficiency 与 /harness 的重复展示层\n- 同步最小必要测试与索引/文档引用

### 不做

- 不重写 delivery、releases、tasks 的核心数据契约\n- 不扩大到 bootstrap Python 大文件拆分\n- 不新建第二套设计文档或额外治理层

### 约束

- 优先删除，再合并，再简化\n- 保持首页、任务页、发布页、知识页主路径可用\n- 不为未来扩展保留额外抽象

### 关键风险

AI 效率详情页和控制面页有被已有使用者直接访问的可能；需要用现有首页摘要与页面 smoke 确认信息没有被误删。

### 测试策略

- 为什么测：这轮改动以删除和收链为主，最容易破坏的是路由渲染、模块导出和现有读模型契约。
- 测什么：- studio 相关 Vitest\n- pnpm test 最小回归\n- 必要时补一次 build
- 不测什么：不额外做运行时发布或 bootstrap 外挂场景验证。
- 当前最小集理由：先保护正在被页面和脚本消费的读模型与路由；历史废壳本身不值得再加新测试。

## 交付结果

- 状态：doing
- 体验验收结果：
  待执行
- 交付结果：
  待执行
- 复盘：
  待执行

## 分支

`codex/task-091-first-thinning`

## 关联模块

- `.cursor/rules/00-project-entry.mdc`
- `CLAUDE.md`
- `OPENCODE.md`
- `agent-coordination/manifest/manifest.json`
- `agent-coordination/reports/risk-report.json`
- `apps/studio/src/app/ai-efficiency/page.tsx`
- `apps/studio/src/modules/docs/__tests__/repository.test.ts`
- `apps/studio/src/modules/git-health/__tests__/service.test.ts`
- `apps/studio/src/modules/git-health/index.ts`
- `apps/studio/src/modules/git-health/module.md`
- `apps/studio/src/modules/git-health/service.ts`
- `apps/studio/src/modules/git-health/types.ts`
- `apps/studio/src/modules/orchestration/__tests__/service.test.ts`
- `apps/studio/src/modules/orchestration/module.md`
- `apps/studio/src/modules/orchestration/service.ts`
- `apps/studio/src/modules/orchestration/types.ts`
- `apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx`
- `apps/studio/src/modules/portal/constants.ts`
- `apps/studio/src/modules/portal/types.ts`
- `apps/studio/src/modules/project-state/__tests__/ai-efficiency-card.test.tsx`
- `apps/studio/src/modules/project-state/components/ai-efficiency-card.tsx`
- `apps/studio/src/modules/project-state/index.ts`
- `apps/studio/src/modules/project-state/module.md`
- `code_index/function-index.json`
- `code_index/module-index.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSET_MAINTENANCE.md`
- `docs/OPERATOR_RUNBOOK.md`
- `openspec/specs/orchestration/spec.md`
- `scripts/ai/lib/operator-contract.ts`
- `scripts/compounding_bootstrap/renderers_index.py`
- `shared/project-judgement-live.ts`
- `tests/test_ai_assets_cli.py`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：code_index/module-index.md；code_index/function-index.json
- 路线图：no change: 未更新
- 文档：docs/ARCHITECTURE.md；docs/OPERATOR_RUNBOOK.md；docs/ASSET_MAINTENANCE.md；openspec/specs/orchestration/spec.md；CLAUDE.md；OPENCODE.md；.cursor/rules/00-project-entry.mdc
