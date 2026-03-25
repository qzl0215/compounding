# 任务 task-063-unify-preflight-entry

## 任务摘要

- 短编号：`t-063`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  统一 preflight 入口
- 为什么现在：
  当前仓库对外同时暴露 python3 scripts/pre_mutation_check.py、pnpm preflight 和 pnpm coord:check:pre-task，且后两者语义重叠，会放大误用和执行心智成本。先把动手前门禁收成唯一入口，能在不改 release/review/handoff contract 的前提下持续降低结构熵。
- 承接边界：
  只统一改动前门禁入口：新增共享 preflight gate 和统一 CLI，收口 pnpm preflight、pnpm coord:check:pre-task 与 coord:task:start 的编排关系，并同步高频文档入口；不改 release/review/handoff contract，不改 Studio 展示层，不合并 search/release gate。
- 完成定义：
  pnpm preflight 成为唯一对外推荐入口；无 taskId 时仅执行基础 gate，structural/release 场景明确要求补 taskId；带 taskId 时始终走完整 task guard；coord:check:pre-task 退化为兼容别名；相关文档统一到新命名。

## 执行合同

### 要做

- `scripts/coord/preflight.ts`
- `scripts/coord/lib/preflight-gate.ts`
- `scripts/coord/check.ts`
- `scripts/coord/task.ts`
- `package.json`
- `AGENTS.md`
- `README.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `memory/project/current-state.md`
- `tests/coord_support.py`
- `tests/test_coord_cli.py`

### 不做

- `scripts/pre_mutation_check.py` 跨语言重写
- `coord:task:search` / review / handoff / release gate 合并
- Studio 首页或 git-health 读模型改造
- release / companion contract 改版

### 约束

- 保持 `output/agent_session/latest_pre_mutation_check.json` 为基础 preflight 唯一落盘文件
- 保持现有 decision card、scope guard、runtime check 与 companion 回写语义不变
- 兼容 `pnpm coord:check:pre-task` 旧入口，避免打断现有脚本消费方

### 关键风险

如果统一入口只做命名换皮而没有明确 basic/task guard 分层，会继续保留双入口心智；如果带 taskId 时仍依赖当前 diff 判断是否跳过 pre-task，会让结构任务在开工前被误判为 light。

### 测试策略

- 为什么测：这轮改的是门禁入口和脚本编排，最容易回退的是 guard level 判定、兼容入口输出 shape 和 coord:task:start 的启动链。
- 测什么：统一 preflight CLI 的 basic/task 两条路径、coord 兼容别名、coord:task:start 转发链、latest_pre_mutation_check.json 继续被写出。
- 不测什么：不改 release/runtime/review 行为，不新增 Studio 组件测试。
- 当前最小集理由：只要锁住入口 contract、退出码和兼容别名，就能用最小测试集防止门禁语义回退。

## 交付结果

- 状态：done
- 体验验收结果：
  `pnpm preflight` 已成为唯一对外推荐入口；带 `--taskId` 时会稳定进入完整 task guard，兼容别名和 `coord:task:start` 都已复用同一条链。
- 交付结果：
  新增共享 `preflight-gate` 与统一 CLI，`coord:check:pre-task` 退化为兼容壳；basic/task guard contract、测试 fixture 和高频文档入口已同步收口。
- 复盘：
  真正该统一的不是“再加一个脚本名”，而是把 `taskId` 明确收成 guard level 升级信号；这样才能消掉“还没改文件就被判成 light”的长期歧义。

## 当前模式

工程执行

## 分支

`main`

## 关联模块

- `scripts/pre_mutation_check.py`
- `scripts/coord/preflight.ts`
- `scripts/coord/lib/preflight-gate.ts`
- `scripts/coord/check.ts`
- `scripts/coord/task.ts`
- `package.json`
- `AGENTS.md`
- `README.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
  - `memory/project/current-state.md`
  - `memory/project/operating-blueprint.md`
  - `memory/project/roadmap.md`
- `tests/coord_support.py`
- `tests/test_coord_cli.py`

## 更新痕迹

- 记忆：updated current-state / operating-blueprint to focus on t-063 unified preflight entry
- 索引：no change
- 路线图：updated roadmap to move from t-062 milestone to next simplification candidate after preflight unification
- 文档：tasks/queue/task-063-unify-preflight-entry.md
