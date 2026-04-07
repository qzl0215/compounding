# 任务 task-053-decouple-local-prod-runtime-from-release-worktree

## 任务摘要

- 短编号：`t-053`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  让本地 production 从固定 runtime 副本启动，不再依赖 release worktree 作为运行 cwd。
- 为什么现在：
  当前清理 worktree 时仍必须保留一个 release worktree 给本地 production 进程使用，说明 runtime 与 release worktree 仍然耦合。
- 承接边界：
  只收本地 production runtime 与 release 切换链；不重做 dev preview，也不改远端部署模型。
- 完成定义：
  本地 production 运行 cwd 不再指向 release worktree；production 能健康启动并通过 prod check；清理后 worktree 只剩主工作区。

## 执行合同

### 要做

- 引入 prod runtime materialize 层，把 active prod 物化到固定 runtime 副本目录。
- 让 `accept-dev-release`、`switch-release`、`rollback-release` 都改从该 runtime 副本切换本地 production。
- 保持 release registry 与现有本地 production 命令兼容。
- 补最小测试和状态回写，并在切换完成后清理多余 worktree。

### 不做

- 不把 dev preview 改成去 worktree 模式。
- 不改远端生产部署模型。
- 不重做 release registry 或新增新的长期状态源。

### 约束

- 保持现有 release registry、本地 production 命令和 `prod:status / prod:check` 兼容。
- 优先最小改动，不引入第二套 runtime 管理系统。

### 关键风险

- 若切换链处理不当，可能导致本地 production 起不来，或 `current` 链接与实际运行目录不一致。

### 测试策略

- 为什么测：这轮要验证 release 切换、runtime 启动和 worktree 清理边界是否仍然稳定。
- 测什么：`prod:status`、`prod:check`、runtime materialize/prune 的最小回归，以及相关静态校验。
- 不测什么：不新增远端部署测试，不重做 preview 流。
- 当前最小集理由：覆盖 runtime cwd 脱离 worktree 的关键风险点，避免为低价值路径增加新门禁。

## 交付结果

- 状态：done
- 体验验收结果：
  本地 production 已从固定 runtime 副本目录启动，`cwd` 不再指向 release worktree；`git worktree list` 只剩主工作区。
- 交付结果：
  新增 prod runtime materialize/prune 逻辑，并接入 `accept-dev-release`、`switch-release`、`rollback-release`；materialize 后会补一轮 install，确保 runtime 副本不依赖 release worktree 或临时 worktree 的 node_modules 链接；当前 active prod 已成功切到 `.compounding-runtime/live/prod/20260324144838-9b553a5-prod` 并通过健康检查。
- 复盘：
  真正需要删除的不是 worktree 本身，而是 runtime 对 release worktree 的运行依赖；release cutover 必须产出自包含 runtime 副本，否则 pnpm 链接会把运行时悄悄绑回临时源目录。
