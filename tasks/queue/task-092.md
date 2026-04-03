# 把控制面行为差异收成一致性账本

## 任务摘要

- 任务 ID：`task-092`
- 短编号：`t-092`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把控制面行为差异收成一致性账本
- 为什么现在：
  当前 harness 已有 live snapshot 与 summary-first 主链，但缺少可校验的场景账本与 freshness guard；继续只靠文档和零散测试，控制面行为漂移不会被及时暴露。
- 承接边界：
  只实现 phase-1 的 harness parity ledger：为 harness/orchestration 的关键控制面路径新增场景 manifest、spec/doc 引用校验、repo-native diff/check CLI 与最小 fixture；不扩到全量工具面、远程 runtime 或第二状态源。
- 完成定义：
  harness 关键路径已有稳定场景清单；每个场景都能映射到 harness/orchestration spec 或主源文档；checker 能在引用缺失、场景漏测或 CLI/Studio 行为失配时失败；相关测试覆盖通过。
- 交付轨道：`direct_merge`

## 执行合同

### 要做

- 新增 harness parity 场景 manifest 与映射结构
- 新增 repo-native parity check / diff CLI
- 补齐 harness CLI、Studio service、orchestration 共享读模型的最小 fixture
- 按需更新 openspec / 模块文档 / operator runbook 的引用痕迹

### 不做

- 不做全量 Claude Code 工具面 parity
- 不新增数据库、后台 scheduler 或第二状态源
- 不重写 release 流、task 状态机或 summary-harness 主骨架

### 约束

继续遵守主源 / 派生物边界；parity ledger 只做校验与可见性，不反向成为状态真相；CLI 与 Studio 仍必须共用同一份 orchestration / harness snapshot。

### 关键风险

如果场景颗粒度过粗，checker 只能证明“有测试”而不能定位漂移；如果把 parity manifest 写成第二套说明书，也会与主源重新分叉。

### 测试策略

- 为什么测：这轮会新增控制面场景账本、checker 和共享 fixture，最容易出错的是 spec 引用漂移、场景清单漏项，以及 CLI/Studio 对同一快照的解释不一致。
- 测什么：- Python unittest / TS 测试覆盖 harness parity checker 与场景映射
- harness CLI fixture
- Studio harness/orchestration service 最小回归
- 必要时跑一次 preflight / static gate
- 不测什么：不做真实远程服务、全量 MCP 生命周期或生产发布场景验证。
- 当前最小集理由：优先用最轻的场景 fixture 锁住控制面行为合同，先证明“控制面没漂”，再考虑扩场景。

## 交付结果

- 状态：
- 体验验收结果：
  
- 交付结果：
  
- 复盘：
  

## 分支

`codex/task-092-harness-parity-ledger`

## 关联模块

- `scripts/harness/`
- `shared/harness/`
- `apps/studio/src/modules/harness/`
- `apps/studio/src/modules/orchestration/`
- `openspec/specs/harness/spec.md`
- `openspec/specs/orchestration/spec.md`
- `tests/`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
