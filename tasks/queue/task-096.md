# 建立治理守护矩阵与探针

## 任务摘要

- 任务 ID：`task-096`
- 短编号：`t-096`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  建立治理守护矩阵与探针
- 为什么现在：
  治理断言已经能生成 gap 和 task，但还没有一层显式 guard 注册表说明哪些规则由谁守，导致 GOV-GAP-05 仍停留在约定。
- 承接边界：
  只覆盖治理控制面的 Assertion -> Guard 映射；新增守护矩阵、轻量 validator、静态门禁接入与最小主源回写；不扩业务模块，不改状态机。
- 完成定义：
  operating-blueprint 已有治理守护矩阵 v1；`ai:validate-governance-guards` 能校验 A4/A6/A7/A9 的 guard 注册表与 static gate 接入；`GOV-GAP-05` 已在主源中闭合。
- 交付轨道：`direct_merge`

## 治理绑定

- 主治理差距：`GOV-GAP-05`
- 来源断言：`A9`
- 回写目标：
  - `Current`
  - `Tests`

## 执行合同

### 要做

- 在 `operating-blueprint` 内新增治理守护矩阵 v1
- 新增 `ai:validate-governance-guards` 及其最小解析 helper
- 接入 `package.json` 的 static gates
- 回写 `TEST_MATRIX`、`current-state`、`governance-gaps`
- 补 `tests/` 中的契约测试

### 不做

- 不把 `A5` 纳入首轮 guard 映射
- 不新增独立 `governance-guards` 文档
- 不判断 guard 的语义充分性
- 不扩到业务模块断言

### 约束

- v1 只允许 `A4` / `A6` / `A7` / `A9` 四条 active assertions
- 守护注册表只能挂在 `operating-blueprint` 内
- validator 只做注册表与入口探针，不做更重推理

### 关键风险

- 若守护矩阵长成第二套 truth，会重新制造并列主源
- 若把 `A5` 硬塞进首轮，会把状态收口问题误做成 guard 问题
- 若 validator 不校验 `validate:static` 接入，注册表会退化成说明文字

### 测试策略

- 为什么测：这是治理断言第一次被映射到真实守护入口，需要证明 guard 注册表既存在又真正接入 static gate。
- 测什么：守护矩阵解析、缺项/重复/非法 guard 失败场景、`validate:static` 接入探针、现有 task-git/docs 仓回归。
- 不测什么：不判断 guard 质量是否充分；不扩业务模块守护覆盖。
- 当前最小集理由：先把断言和守护入口稳定连起来，防止治理规则继续只靠人工记忆。

## 交付结果

- 状态：已完成
- 体验验收结果：
  `operating-blueprint` 已能直接回答 `A4 / A6 / A7 / A9` 各由谁守，`ai:validate-governance-guards` 能拦截缺项、重复、非法 guard 与 `validate:static` 漂移。
- 交付结果：
  已新增治理守护矩阵 v1、守护探针脚本与仓级契约测试，并回写 `Current` 与治理 backlog；治理面现在可稳定回答 `assertion -> guard`。
- 复盘：
  v1 先只守注册表与门禁接入，不把 `A5` 和 guard 语义充分性硬塞进首轮范围，避免守护层重新长成第二套状态真相。

## 分支

`codex/task-096-governance-guards`

## 关联模块

- `package.json`
- `docs/TEST_MATRIX.md`
- `scripts/ai/validate-governance-guards.ts`
- `scripts/ai/lib/governance-guard-contract.ts`
- `memory/project/governance-gaps.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`
- `tests/`

## 更新痕迹

- 记忆：memory/project/current-state.md；memory/project/governance-gaps.md
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：memory/project/operating-blueprint.md；docs/TEST_MATRIX.md
