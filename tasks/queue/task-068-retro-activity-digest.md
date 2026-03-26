# 记录耗时弯路并生成复盘候选

## 任务摘要

- 任务 ID：`task-068-retro-activity-digest`
- 短编号：`t-068`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  记录耗时弯路并生成复盘候选
- 为什么现在：
  下一个新 Agent 最需要快速知道时间耗在哪儿、弯路为何重复，以及有没有现成 shortcut；这轮先用轻量派生产物把这条链跑通。
- 承接边界：
  只改 coord/release 入口、companion 摘要、临时派生产物和高频文档，不改 Studio UI 或 experience 主源。
- 完成定义：
  structural/release task 会自动记录阶段耗时；24h 后 raw trace 会 compact 进 companion digest；重复 blocker 会生成 retro candidate；preflight/task:start 会带出 hints。

## 执行合同

### 要做

- 为 structural/release task 增加 24h TTL activity trace
- 扩 companion artifacts，增加 iteration_digest
- 生成 retro candidates 派生产物并接到 preflight 输出
- 更新高频文档与测试

### 不做

- 不做命令级细日志
- 不改 Studio 页面
- 不自动升格到 memory/experience/*
- 不覆盖 light 改动

### 约束

- raw trace 只保留 24 小时
- 只记录阶段级 active/wait 时间
- search 只记 note，不单独计时
- 不新增数据库或长期第二状态源

### 关键风险

- companion schema 扩展要保持兼容
- release/coord 入口分散，容易漏记阶段切换
- cleanup 逻辑若不稳，可能误删或重复累计

### 测试策略

- 为什么测：这轮同时改 coord、release 和 companion 写回，必须验证事件采集、compact 和 CLI contract 都稳定。
- 测什么：coord CLI task/basic preflight 输出、activity trace compact 与 digest 聚合、retro candidates 生成阈值与输出、release/review 入口不会破坏现有 contract。
- 不测什么：不做 Studio UI 回归，不做真实长时间 24h 端到端，只做时间注入测试。
- 当前最小集理由：优先用脚本级测试覆盖多入口与 cleanup 逻辑，避免这轮引入长期噪音状态源。

## 交付结果

- 状态：doing
- 体验验收结果：
  `pnpm preflight -- --taskId=t-068` 已能带出 retro hints；阶段 activity、24 小时 compact 和重复 blocker candidate 都已通过 coord/AI 侧定向测试。
- 交付结果：
  新增 `task-activity` 轻量轨迹层和 `ai:retro-candidates` 生成器；preflight/task/review/release 入口会自动写阶段事件，长期只把聚合后的 `iteration_digest` 留在 companion，重复 blocker 只落成派生产物候选。
- 复盘：
  复盘链最容易犯的错是“为了记录而先写文件”，这会反过来把 preflight 自己弄成 dirty；这轮真正收住复杂度的关键是坚持先读后写，让 retro hints 只消费已有摘要，而不是在门禁前制造新状态。

## 当前模式

工程执行

## 分支

`codex/task-068-retro-activity-digest`

## 关联模块

- `package.json`
- `AGENTS.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `docs/ASSET_MAINTENANCE.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`
- `memory/project/roadmap.md`
- `memory/experience/README.md`
- `scripts/ai/`
- `scripts/coord/lib/`
- `scripts/coord/task.ts`
- `scripts/coord/review.ts`
- `scripts/release/`
- `tests/`
- `tasks/queue/task-068-retro-activity-digest.md`

## 更新痕迹

- 记忆：updated current-state / operating-blueprint to record retro digest and candidate flow
- 索引：no change: 未更新
- 路线图：updated roadmap priority to return to derived-asset semantics after t-068
- 文档：updated AGENTS / DEV_WORKFLOW / AI_OPERATING_MODEL / memory/experience/README for the retro trace -> digest -> candidate path
