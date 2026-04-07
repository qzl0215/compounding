# 收口 orchestration canonical controlPlane 摘要

## 任务摘要

- 任务 ID：`task-089`
- 短编号：`t-089`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  收口 orchestration canonical controlPlane 摘要
- 为什么现在：
  单一控制平面内核与 orchestration snapshot 已经落地，但读模型里还缺一层显式的 canonical controlPlane 摘要；把这层补上，可以让 Studio / CLI 继续沿用同一份 snapshot，同时把“谁在负责拼真相”进一步压成一个可测入口。
- 承接边界：
  只给 `apps/studio/src/modules/orchestration/*` 增加 canonical controlPlane 摘要，并用最小测试和模块说明固化这层语义；不重写 harness 内核，不改 release 流，不引入数据库或第二套读模型。
- 完成定义：
  `OrchestrationSnapshot` 显式暴露 `controlPlane`，其内容只来自现有 harness 事实与既有投影；首页、任务页、发布页和 `/harness` 仍共读同一份 orchestration snapshot；相关测试与静态门禁通过。
- 交付轨道：`direct_merge`

## 执行合同

### 要做

- 在 `apps/studio/src/modules/orchestration/types.ts` 中补 `controlPlane` 类型。
- 在 `apps/studio/src/modules/orchestration/service.ts` 中由现有 harness snapshot 派生 `controlPlane` 摘要。
- 在 `apps/studio/src/modules/orchestration/__tests__/service.test.ts` 中锁住 controlPlane 字段与 harness 事实的一致性。
- 在 `apps/studio/src/modules/orchestration/module.md` 中说明 controlPlane 只是 canonical summary，不是第四套真相源。
- 让 task 记录与当前 branch 绑定，避免 structural 变更失去执行合同。

### 不做

- 不改 `shared/harness` 的 reducer / router 语义。
- 不把 `controlPlane` 做成新的写入口。
- 不改 release、runtime、task 文档结构的其他部分。
- 不引入额外运行时或数据库。

### 约束

- `controlPlane` 只能是现有 harness 事实的显式投影。
- `/harness`、首页、任务页、发布页继续共读同一份 orchestration snapshot。
- 任何页面层的高层判断都必须能回溯到 harness snapshot，而不是本地重算。

### 关键风险

- 如果 `controlPlane` 以后开始塞入派生解释层，就会重新长出第四套真相源。
- 如果只改类型不补测试，后续页面很容易把 canonical summary 当成普通字段误用。
- 如果模块说明不写清楚，控制平面语义会再次被 UI 口径吞掉。

### 测试策略

- 为什么测：
  这轮只是在既有 orchestration snapshot 上补 canonical summary，风险主要在类型漂移和页面误读。
- 测什么：
  - `pnpm --filter studio test -- apps/studio/src/modules/orchestration/__tests__/service.test.ts`
  - `pnpm --filter studio test -- apps/studio/src/modules/harness/__tests__/service.test.ts`
  - `pnpm validate:static`
- 不测什么：
  - 不重跑整套 release 流
  - 不重写 harness CLI 的事件流命令
  - 不扩展 Studio 的页面逻辑
- 当前最小集理由：
  先锁住 canonical summary 的类型、测试和模块说明，确认它只是显式投影，而不是新的状态源。

## 交付结果

- 状态：完成
- 体验验收结果：
  `OrchestrationSnapshot` 已显式暴露 `controlPlane` canonical summary，`Home` / `Tasks` / `Releases` / `/harness` 继续共读同一份 orchestration snapshot，不再需要从各自模块重拼真相。
- 交付结果：
  `apps/studio/src/modules/orchestration/*` 已补入 `controlPlane` 类型、派生逻辑与模块说明；`apps/studio/src/modules/orchestration/__tests__/service.test.ts` 已锁住 controlPlane 与 harness 事实的一致性；`pnpm validate:static` 与相关 studio tests 已通过。
- 复盘：
  单一控制平面真正的收口点不是再造一个新的真相层，而是把它显式地从既有 harness 事实里投影出来，并用测试和模块文档把边界写死。

## 分支

`codex/task-089-harness-prd`

## 关联模块

- `apps/studio/src/modules/orchestration/`
- `apps/studio/src/modules/harness/`
- `tasks/queue/task-088.md`

## 更新痕迹

- 记忆：no change
- 索引：no change
- 路线图：no change
- 文档：updated orchestration module docs
