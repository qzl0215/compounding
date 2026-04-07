# 收口任务状态真相并退役顶层模式兼容字段

## 任务摘要

- 任务 ID：`task-097`
- 短编号：`t-097`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  收口任务状态真相并退役顶层模式兼容字段
- 为什么现在：
  当前状态机主源已经成立，但消费链仍通过 prose 和顶层模式兼容兜底，继续保留会让状态真相分叉。
- 承接边界：
  只处理 active/未来 task 的状态读写链，统一收口到 state machine 与 companion.machine.*；不批量迁移历史 task。
- 完成定义：
  active/未来 task 的状态判断只认 kernel/task-state-machine.yaml 与 companion.machine.*；顶层模式兼容字段退出 companion、CLI、Studio、validator 的状态读写链，历史 task 仅保留最小兼容读取。
- 交付轨道：`direct_merge`



## 执行合同

### 要做

- 退役 task machine facts 中的当前模式兼容字段与 companion 顶层模式字段
- 收口 task 解析、companion 写链、CLI 输出与消费端状态读取
- 同步模板与治理主源规则，并补齐回归测试

### 不做

- 不改 task-state-machine 的状态集合和事件集合
- 不批量迁移历史 task 文档或旧 companion
- 不把 A5 扩成新的 guard 或文档体系

### 约束

- 机器状态唯一真相只认 state machine + companion.machine.*
- task prose 的 状态 仅保留人类展示
- 历史 task 只保留最小兼容，不扩大迁移面

### 关键风险

历史 task 仍存在 legacy prose 和顶层模式兼容字段；如果消费端 fallback 剪得太急，可能导致旧记录显示退化或 validator 误报。

### 测试策略

- 为什么测：这轮是状态源收口，最容易破坏 task 解析、Studio 展示、CLI 输出和 validator 的兼容链。
- 测什么：
  - `tests.test_coord_cli`
  - task module Vitest
  - portal stage / docs repository 相关测试
  - `pnpm ai:validate-task-git`
  - `pnpm validate:static`
- 不测什么：不补运行时 release 验收；不做历史 task 批量修复测试。
- 当前最小集理由：先保护 active/未来 task 的 canonical state 读写链，再允许历史任务以最小兼容存在。

## 交付结果

- 状态：进行中
- 体验验收结果：
  已验证 active/未来 task 只认 `kernel/task-state-machine.yaml` 与 `companion.machine.*`，`current_mode` 不再进入写读链。
- 交付结果：
  `shared`、`scripts/coord`、`scripts/ai`、`scripts/harness`、`apps/studio`、`docs` 和 `memory` 的状态口径已统一收口，历史 task 仅保留最小兼容读取。
- 复盘：
  状态真相已经收口到 canonical machine，后续只需维持历史 task 的最小兼容，不再恢复顶层模式兼容字段。

## 分支

`codex/task-097-a5-state-truth-consolidation`

## 关联模块

- `shared/task-contract.ts`
- `shared/task-state-machine.ts`
- `shared/project-judgement-live.ts`
- `scripts/coord/lib/task-meta.ts`
- `scripts/coord/lib/companion-shape.ts`
- `scripts/coord/lib/task-machine.ts`
- `scripts/coord/task.ts`
- `scripts/ai/validate-task-git-link.ts`
- `scripts/ai/lib/feature-context.ts`
- `scripts/harness/lib.ts`
- `apps/studio/src/modules/tasks/companion.ts`
- `apps/studio/src/modules/tasks/parsing.ts`
- `apps/studio/src/modules/tasks/service.ts`
- `apps/studio/src/modules/tasks/types.ts`
- `apps/studio/src/modules/tasks/components/delivery-table-row.tsx`
- `apps/studio/src/modules/portal/overview-items.ts`
- `apps/studio/src/modules/tasks/__tests__/contract.test.ts`
- `apps/studio/src/modules/tasks/__tests__/service.test.ts`
- `apps/studio/src/modules/tasks/__tests__/subtask-table.test.ts`
- `apps/studio/src/modules/portal/__tests__/stage-model.test.ts`
- `tests/test_coord_cli.py`
- `tests/test_ai_feature_context.py`
- `tasks/templates/task-template.md`
- `AGENTS.md`
- `docs/DEV_WORKFLOW.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`

## 更新痕迹

- 记忆：memory/project/current-state.md；memory/project/operating-blueprint.md
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：AGENTS.md；docs/DEV_WORKFLOW.md；tasks/templates/task-template.md
