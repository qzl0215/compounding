# 收口 release 单一状态机与 registry 投影

## 任务摘要

- 任务 ID：`task-099`
- 短编号：`t-099`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  收口 release 单一状态机与 registry 投影
- 为什么现在：
  当前 release 语义仍由 `status`、`acceptance_status`、`active_release_id`、`pending_dev_release_id` 和 runtime 观测拼接，写链和读链已经开始分叉。
- 承接边界：
  只收 release 生命周期，不并入 task 状态机，不把 runtime 健康/端口状态并入 release 真相。
- 完成定义：
  `kernel/release-state-machine.yaml` + `shared/release-state-machine.ts` 成为唯一 release 状态真相；`shared/release-registry.ts` 只做投影/修复；`scripts/release/*`、Studio、harness 与 project judgement 统一读 `state_id` / `state_label`。
- 交付轨道：`direct_merge`

## 治理绑定

- 主治理差距：`GOV-GAP-07`
- 来源断言：`A12`
- 回写目标：
  - `Current`
  - `Tests`

## 执行合同

### 要做

- 新增 release 状态机主合同与 schema，补共享解析器与 transition helper
- 收口 release prepare / accept / reject / switch / rollback 写链
- 收口 release registry 归一与 Studio / harness / project-judgement 读链
- 补最小测试与门禁

### 不做

- 不改 task 状态机
- 不做历史 release 批量迁移
- 不引入数据库或 event store

### 约束

- `release_id` 作为生命周期 ID
- registry 只做缓存索引和 projection
- runtime 只做观测与验收证据

### 关键风险

legacy `status` / `acceptance_status` / pointer 仍可能在个别消费者里被误当主源。

### 测试策略

- 为什么测：这是 release 真相收口，最容易把 legacy 投影重新抬回主源。
- 测什么：release 相关 Studio / harness / registry / CLI 的最小回归，以及 `pnpm validate:static`
- 不测什么：不做历史 release 记录批量迁移，不把 runtime 健康并入状态真相。
- 当前最小集理由：先锁定单一状态机、共享解析器和消费端读链，防止 release 继续散成多套解释层。

## 交付结果

- 状态：进行中
- 体验验收结果：
- 交付结果：
- 复盘：

## 分支

`codex/task-099-release-single-state-machine-convergence`

## 关联模块

- `kernel/release-state-machine.yaml`
- `schemas/release-state-machine.schema.yaml`
- `shared/release-state-machine.ts`
- `shared/release-registry.ts`
- `scripts/release/accept-dev-release.ts`
- `scripts/release/prepare-release-support.ts`
- `scripts/release/prepare-release.ts`
- `scripts/release/reject-dev-release.ts`
- `scripts/release/registry.ts`
- `scripts/release/switch-release.ts`
- `scripts/release/rollback-release.ts`
- `apps/studio/src/modules/releases/`
- `apps/studio/src/modules/tasks/delivery.ts`
- `apps/studio/src/modules/project-state/`
- `scripts/harness/lib.ts`
- `shared/project-judgement-live.ts`
- `memory/project/current-state.md`
- `memory/project/governance-gaps.md`
- `memory/project/operating-blueprint.md`

## 更新痕迹

- 记忆：`memory/project/current-state.md`；`memory/project/governance-gaps.md`
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：`memory/project/operating-blueprint.md`
