# 派生产物语义收口：统一主合同设计

## 任务摘要

- 任务 ID：`task-098`
- 短编号：`t-098`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  派生产物语义收口：统一主合同设计
- 为什么现在：
  当前仓库对 code_index、output、agent-coordination、.compounding-runtime 的语义仍分散在多处脚本和文档里，已经影响变更判断和回灌边界，需要收口成单一机器合同。
- 承接边界：
  只收 code_index / output / coordination / runtime 的语义，不碰首页、任务页、发布页 snapshot UI。
- 完成定义：
  kernel/derived-asset-contract.yaml 成为唯一派生产物语义合同，相关脚本与 validator 统一从合同读取 truth role / freshness / ignore-as-truth，且静态门禁通过。
- 交付轨道：`direct_merge`

## 治理绑定

- 主治理差距：`GOV-GAP-06`
- 来源断言：`A11`
- 回写目标：
  - `Current`
  - `Tests`

## 执行合同

### 要做

新增 kernel/derived-asset-contract.yaml 与 schema、共享解析器、验证脚本、消费端接入、知识资产投影更新、最小测试覆盖。

### 不做

不重做 snapshot UI，不扩大到 task 状态机，不批量迁移历史产物。

### 约束

主合同是代码主源，YAML 只是载体；不新增第二套平行语义文档；不把 code_index 抬成主源。

### 关键风险

如果合同口径与现有脚本忽略规则不一致，会把历史输出或运行态误判为主源。

### 测试策略

- 为什么测：这是派生产物语义合同的结构性收口，必须证明合同、消费端和门禁都只认同一套 truth role / ignore-as-truth 口径。
- 测什么：pnpm ai:validate-derived-asset-contract; python3 -m pytest tests/test_derived_asset_contract.py tests/test_ai_feature_context.py tests/test_coord_cli.py tests/test_ai_assets_cli.py; pnpm validate:static
- 不测什么：不做 snapshot UI 改版，不批量迁移历史产物，不扩到 task 状态机。
- 当前最小集理由：先锁定单一合同、共享解析器和消费端读链，防止派生产物继续散成多套解释层。

## 交付结果

- 状态（派生展示）：
- 体验验收结果：
  
- 交付结果：
  
- 复盘：
  

## 分支

`codex/task-098-derived-asset-contract`

## 关联模块

- `AGENTS.md`
- `docs/AI_OPERATING_MODEL.md`
- `docs/ARCHITECTURE.md`
- `docs/ASSET_MAINTENANCE.md`
- `memory/project/current-state.md`
- `memory/project/governance-gaps.md`
- `memory/project/operating-blueprint.md`
- `memory/project/roadmap.md`
- `package.json`
- `scripts/ai/generate-code-volume.ts`
- `scripts/ai/lib/change-policy.ts`
- `scripts/ai/lib/cleanup-candidates.ts`
- `scripts/ai/lib/knowledge-assets.ts`
- `scripts/ai/validate-derived-asset-contract.ts`
- `scripts/coord/scan.ts`
- `scripts/pre_mutation_check.py`
- `shared/derived-asset-contract.ts`
- `kernel/derived-asset-contract.yaml`
- `schemas/derived-asset-contract.schema.yaml`
- `tests/coord_support.py`
- `tests/test_ai_feature_context.py`
- `tests/test_coord_cli.py`
- `tests/test_derived_asset_contract.py`
- `memory/project/governance-gaps.md`
- `memory/project/current-state.md`
- `code_index/`
- `tests/`

## 更新痕迹

- 记忆：`memory/project/current-state.md`；`memory/project/governance-gaps.md`
- 索引：no change: 未更新
- 路线图：`memory/project/roadmap.md`
- 文档：`AGENTS.md`；`docs/AI_OPERATING_MODEL.md`；`docs/ARCHITECTURE.md`；`docs/ASSET_MAINTENANCE.md`；`memory/project/operating-blueprint.md`
