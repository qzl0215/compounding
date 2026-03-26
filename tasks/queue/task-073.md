# 统一知行判断合同与人类友好入口

## 任务摘要

- 任务 ID：`task-073`
- 短编号：`t-073`
- 父计划：``
- 任务摘要：
  统一知行判断合同与人类友好入口
- 为什么现在：
  让规划、AI执行链和Studio展示读取同一套判断语义，并把AI feature入口和三模式外部入口收成默认工作流
- 承接边界：
  只复用现有 project-state、feature-context、bootstrap/doctor、Studio 页面与 operator asset 生成链；不新增数据库或重型向导
- 完成定义：
  project-state/UI/AI/doctor 对关键判断字段一致；feature-context 输出默认执行建议；runbook 明确三模式入口；最小 golden matrix 覆盖三模式 smoke

## 执行合同

### 要做

- 共享 judgement contract，并让 project-state 与 feature-context 读取同一套判断字段。
- 给任务页和发布页接入共用判断条，保持首页的人类优先语气。
- 把三模式入口和默认 AI feature 入口写进 generated runbook / tool entry。
- 补 judgement contract 校验和最小 golden matrix 测试。

### 不做

新增后台表、复杂安装器、重做首页视觉、支持更多 adapter 类型

### 约束

AI代码侧保持薄层复用；人类UI保持浅色实验室语气和首屏判断优先；不新增第二套状态源

### 关键风险

- judgement contract 如果只在一侧落地，会让 UI、AI 与 bootstrap 再次各写一套判断语义。

### 测试策略

- 为什么测：这是结构性收口，需验证共享判断、Bootstrap 三模式和页面展示一致性
- 测什么：python3 -m unittest tests.test_bootstrap_scaffold_cli tests.test_bootstrap_proposals_cli tests.test_ai_assets_cli && pnpm --filter studio test -- apps/studio/src/modules/project-state/__tests__/service.test.ts apps/studio/src/modules/portal/__tests__/service.test.ts apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx && pnpm ai:validate:static:summary
- 不测什么：
- 当前最小集理由：

## 交付结果

- 状态：doing
- 体验验收结果：
  Studio 首页逻辑语气已延伸到任务页和发布页；AI feature 上下文现在会直接带出共享 judgement 与 default loop；三模式入口能在 doctor 与 generated runbook 中直接说明。
- 交付结果：
  共享 judgement contract 已复用到 project-state 与 feature-context；新增 judgement contract validator；operator runbook / tool entry 补上三模式与默认 AI feature 入口；最小 golden matrix 已覆盖 cold_start / normalize / ai_upgrade。
- 复盘：
  显式 mode 与源仓复制 brief 不能混为一谈；attach 场景的高价值事实不是“立刻 ready”，而是“proposal 与缺口判断稳定可用”。

## 当前模式

工程执行

## 分支

`codex/task-073`

## 关联模块

- `shared/project-judgement.ts`
- `apps/studio/src/modules/project-state/`
- `apps/studio/src/app/tasks/page.tsx`
- `apps/studio/src/app/releases/page.tsx`
- `scripts/ai/lib/feature-context.ts`
- `scripts/ai/validate-judgement-contract.ts`
- `scripts/ai/lib/operator-contract.ts`
- `scripts/compounding_bootstrap/config_resolution.py`
- `scripts/compounding_bootstrap/doctor.py`
- `docs/OPERATOR_RUNBOOK.md`
- `CLAUDE.md`
- `OPENCODE.md`
- `.cursor/rules/00-project-entry.mdc`
- `kernel/kernel_manifest.yaml`
- `package.json`
- `tests/test_ai_feature_context.py`
- `tests/test_ai_assets_cli.py`
- `tests/test_bootstrap_scaffold_cli.py`
- `tests/test_bootstrap_golden_matrix.py`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
