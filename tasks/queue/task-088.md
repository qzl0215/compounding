# 建立单一控制平面内核

## 任务摘要

- 任务 ID：`task-088`
- 短编号：`t-088`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  建立单一控制平面内核
- 为什么现在：
  当前仓库已经有 task、release、runtime、project memory 四块真相碎片，但还没有统一内核回答‘现在处于什么状态、为什么卡住、下一步唯一合法动作是什么’；继续补局部流程只会增加兼容壳，必须先把控制面收成单一内核。
- 承接边界：
  只落 phase-1 的单一控制平面：新增 intent/contract/state/action/artifact/runtimeFact 对象模型、事件流加 live snapshot 内核、统一 CLI 入口、Studio orchestration board，以及 task/release/runtime 的 adapter；不把 rollback 改成 native path，不引入数据库。
- 完成定义：
  控制面能创建独立 intent、派生 contract、输出 canonical live snapshot、裁决唯一 next legal action，并让 home/tasks/releases 共读同一 snapshot；direct_merge 与 preview_release 两条主链可跑通，旧 companion 与 release registry 仍能作为 projection 被现有页面和命令读取。
- 交付轨道：`direct_merge`

## 执行合同

### 要做

- 新增 `shared/harness/*`，定义 intent / contract / state / action / artifact / runtimeFact 与 live snapshot 的统一对象模型。
- 新增 `scripts/harness/*`，提供事件流、快照同步、`harness:status`、`harness:events`、`harness:intent:create`、`harness:act` 四个正式入口。
- 把 task、preflight、review、release、runtime 的既有写路径接到 harness 事件记录与快照同步上，同时保留旧 companion / registry 投影。
- 新增 `apps/studio/src/modules/harness/*` 与 `/harness` 页面，并让首页、任务页、发布页共读同一份 harness snapshot。
- 修正 worktree 共享 runtime root、当前任务优先选择、repo 名识别和测试隔离，让控制面在 worktree 与最小 fixture 下都能稳定工作。

### 不做

- 不把 rollback 改成 harness-native path，仍保留现有 release 命令并只吸收其结果。
- 不引入数据库、常驻服务或第二套远端状态源，phase-1 继续使用文件事件流与快照。
- 不继续扩 Superpowers / overlay，也不重写全部历史 task 文档与 companion 结构。
- 不把首页、任务页、发布页变成新的写入口；UI 在本轮只承担统一读模型。

### 约束

内核是唯一写入口；旧 task companion、release registry、task markdown 只做 projection；worktree dirty 只进入 hygiene blockers，不再直接等价 workflow blocked；不引入第二套后台状态源或服务进程。

### 关键风险

如果 reducer、router 和 projector 边界不清，会重新长出双写漂移；如果 Studio 继续保留多源读链，live board 会退化成又一层说明书；如果旧命令还能绕过 router，就失去控制平面意义。

### 测试策略

- 为什么测：这轮会重写状态写入口、引入新内核对象模型、改动 CLI 与 Studio 共用读链，必须先锁住 reducer、router、projection 和现有兼容面的稳定性。
- 测什么：覆盖 event reducer、intent 到 contract 派生、next legal action 裁决、旧 companion/release registry projection、一条 direct_merge 链、一条 preview_release 验收链，以及 Studio 读同一 snapshot 的关键字段一致性。
- 不测什么：不做数据库或远端服务测试，不在 phase-1 重写 rollback 原生命令，不重构全部历史 task 文档。
- 当前最小集理由：先用 shared/scripts 层与 fixture 测试锁住高风险状态迁移和兼容投影，再用最小页面读模型测试确认 UI 不再拼多源真相。

## 交付结果

- 状态：进行中
- 体验验收结果：
  Home、Tasks、Releases、`/harness` 已切到同一份 orchestration snapshot；页面层不再各自拼装 harness / delivery / project-state 真相。
- 交付结果：
  新增 `apps/studio/src/modules/orchestration/*` 作为唯一聚合读模型；`apps/studio/src/app/page.tsx`、`apps/studio/src/app/tasks/page.tsx`、`apps/studio/src/app/releases/page.tsx`、`apps/studio/src/app/harness/page.tsx` 与 `apps/studio/src/app/ai-efficiency/page.tsx` 已改为经由 orchestration service 读取。
- 复盘：
  这轮最重要的收口不是再造一个页面，而是把“谁负责拼真相”收成一个 service；这样 harness 仍负责控制面，Studio 只消费投影，不会继续长出并行读链。

## 分支

`codex/task-088-harness-control-plane`

## 关联模块

- `shared/harness/`
- `scripts/harness/`
- `shared/task-state-machine.ts`
- `scripts/coord/`
- `scripts/release/`
- `scripts/local-runtime/`
- `apps/studio/src/modules/harness/`
- `apps/studio/src/modules/delivery/`
- `apps/studio/src/modules/portal/`
- `apps/studio/src/modules/tasks/`
- `apps/studio/src/modules/releases/`
- `apps/studio/src/app/`
- `apps/studio/src/components/shell/app-shell.tsx`
- `package.json`
- `scripts/ai/create-task.ts`
- `shared/git-workspace.ts`
- `tests/`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：updated: 新增 orchestration module，并同步更新 portal / project-state / delivery / releases / harness 的模块说明
