# 任务 task-059-release-task-state-convergence

## 任务摘要

- 短编号：`t-059`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  收口 release 状态一致性并清除 runtime release worktree
- 为什么现在：
  当前 t-058 已进入 main 与本地 prod，但 release registry 和主源文档仍残留进行中/待验收状态，而且 runtime release 目录本身还是 git worktree，导致 `git worktree list` 仍不干净。
- 承接边界：
  只修 dev->main->prod 之后的状态一致性，并把 runtime release 目录收成普通目录：收紧 pending dev 解析、修正发布脚本回写、同步主源文档，并让 prepare/switch/accept/rollback 不再把 `.compounding-runtime/releases/*` 保留成 git worktree；不新增页面、不重做 release registry、不开新 cleanup 主线。
- 完成定义：
  旧 dev 记录不再误显示为 pending；prepare-release 不再被脏 pending 阻塞；runtime release 目录不再出现在 `git worktree list`；task-058 与 memory 主源回写为已完成事实。

## 执行合同

### 要做

- `scripts/release/registry.ts` 与 `prepare/accept/switch/rollback` 链
- runtime release 目录物化与 worktree 脱钩
- `apps/studio` release/task 读模型
- `task-058` 与 memory 主源回写
- 最小回归测试

### 不做

- `portal` 新功能或读模型拆分
- `bootstrap` / `scripts/ai` 新一轮 cleanup
- release registry 结构重做或新状态源
- 远端部署模型改造

### 约束

- 只收紧现有字段语义、release 目录物化方式与写回时序
- `pending dev` 只能表示真实待验收预览
- 不破坏现有 `prod/runtime` 链路与历史记录兼容读取

### 关键风险

如果 invariant 收得不完整，prepare-release 仍可能被旧 dev 卡住，Studio 会继续把假 pending 展示成待验收，或者 runtime release 目录会继续以 worktree 身份污染主仓库。

### 测试策略

- 为什么测：这轮会同时改 release registry 解析、发布脚本和 runtime release 目录物化，需要锁住真实 pending dev 的唯一语义，以及 release 目录不再长成 worktree。
- 测什么：
  - registry 解析单测
  - release 目录物化不带 `.git` 的回归
  - `pnpm test / pnpm build / pnpm validate:static / pnpm prod:status`
- 不测什么：
  - 不新增端到端浏览器测试
  - 不重走远端部署链
- 当前最小集理由：优先验证假 pending 清除、真实 pending 仍可工作，以及 runtime release 目录从主仓库 worktree 列表里退出。

## 交付结果

- 状态：done
- 体验验收结果：
  release registry、任务交付行和 `/releases` 已不再把已晋升到 prod 的旧 dev 记录显示成待验收；`git worktree list` 只剩主工作区。
- 交付结果：
  新增 `shared/release-registry.ts` 统一 pending dev 判定；scripts 与 Studio 读模型都改为走同一套 reconcile 逻辑；release 目录在 prepare 时直接物化成普通目录，历史 runtime release worktree 也已脱钩。
- 复盘：
  release 状态漂移的根因不是页面显示，而是 registry 语义和 release 目录形态没有收口。把 pending dev 判定提升成共享逻辑，再把 runtime release 从 git worktree 改成普通目录，状态和工作区才会一起干净。

## 当前模式

工程执行

## 分支

`main`

## 关联模块

- `scripts/release/registry.ts`
- `scripts/release/prepare-release.ts`
- `scripts/release/accept-dev-release.ts`
- `scripts/release/switch-release.ts`
- `scripts/release/rollback-release.ts`
- `shared/release-registry.ts`
- `apps/studio/src/modules/releases/registry.ts`
- `apps/studio/src/modules/tasks/delivery.ts`
- `apps/studio/src/modules/releases/__tests__/service.test.ts`
- `apps/studio/src/modules/tasks/__tests__/service.test.ts`
- `tests/test_release_registry_state.py`
- `tests/test_bootstrap_proposals_cli.py`
- `tasks/queue/task-058-ai-cli-orchestration-kernel.md`
- `memory/project/roadmap.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`

## 更新痕迹

- 记忆：updated current-state / roadmap / operating-blueprint after release-state convergence
- 索引：no change: 未更新
- 路线图：moved roadmap back to generic structural review after t-059 closeout
- 文档：tasks/queue/task-058-ai-cli-orchestration-kernel.md, tasks/queue/task-059-release-task-state-convergence.md
