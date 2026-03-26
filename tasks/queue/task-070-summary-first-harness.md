# 实现摘要优先执行压缩链路

## 任务摘要

- 任务 ID：`task-070-summary-first-harness`
- 短编号：`t-070`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  实现摘要优先执行压缩链路
- 为什么现在：
  当前仓库已经有 preflight、operator contract 和 task/activity 主链，但高频 validate/review/runtime 输出仍会把 AI 上下文噪音直接放大；先补 repo-native summary harness、失败保底和节省量追踪，能直接降低执行 token 成本并保住可追溯性。
- 承接边界：
  只实现 phase-1 的 repo-native summary harness：新增可组合压缩流水线、6 个 summary wrapper、tee 与 gain tracking、operator shortcut adoption；不做全局 hook、不做代理化 git/rg/cat/tree/find。
- 完成定义：
  高频 canonical flow 已有稳定的 summary wrapper；失败时 raw tee 可追；gain 报表能按日/周/月看节省量；operator contract 和生成入口能表达 shortcut adoption；现有 gate/review/runtime 语义不变。

## 执行合同

### 要做

- 新增 compact runner、profile、pipeline、tee、tracking 与报表
- 新增 preflight/validate/review/preview/prod 六个 summary CLI
- 扩 operator contract schema/template/asset 生成链，加入 agent_shortcuts
- 补齐脚本级与 fixture 测试
- 更新 task / docs / memory 的必要痕迹

### 不做

- 不做全局 shell proxy 或用户 home hook
- 不做 SQLite、telemetry、跨项目状态库
- 不覆盖通用 git/rg/cat/tree/find 摘要层
- 不改 release、preflight、review 的真实判定逻辑

### 约束

- 继续遵守主源/派生产物边界，tee 与 gain 都只写 output/ai
- wrapper 必须透传底层 exit code
- shortcut 只能是 suggest，不做 rewrite
- 新能力必须通过 profile/pipeline 扩展，不重写 harness 骨架

### 关键风险

- 过滤过度会隐藏关键信息或改变 gate 可读性
- tee/tracking 若元数据不完整，后续 ROI 会失真
- operator contract 若再长一套手写入口，会重回多主源分叉

### 测试策略

- 为什么测：这轮会同时新增执行压缩层、派生产物、operator contract 字段和入口生成，必须锁住 exit code、fallback、保留策略和 adoption 统计。
- 测什么：pipeline 组合顺序、parser/fallback、tee 触发与清理、gain 聚合、summary wrapper fixture、operator shortcut schema 与生成资产同步。
- 不测什么：不做真实远程服务调用，不做用户 home 目录 hook 测试，不做通用 shell 命令代理测试。
- 当前最小集理由：优先用脚本级和 fixture 测试覆盖高风险行为，确保先把 repo-native harness 做稳，再考虑下一阶段扩面。

## 交付结果

- 状态：doing
- 体验验收结果：
  新增 summary harness、六个 wrapper、fail-safe tee、JSONL gain tracking 和 shortcut adoption 后，核心 flow 已能输出短摘要并保留 raw tee；当前实现与专项测试已通过，等待合并前的仓库级 gate 收尾。
- 交付结果：
  已完成 repo-native summary-first harness phase-1 实现：新增 `scripts/ai/lib/summary-harness.ts` 与 profile/tracking 组件、`ai:*:summary` 命令、`ai:command-gain` 报表、`agent_shortcuts` contract 扩展、raw-command adoption 埋点，以及相应测试与生成资产更新。
- 复盘：
  这轮真正要防的是“文本裁剪伪装成摘要系统”，所以实现上把 profile/pipeline、tee 保底、event log 元数据和 adoption 分母一次补齐；后续 phase 1.5 可以直接在同一骨架上接 read/find/tree/diff profile。

## 当前模式

工程执行

## 分支

`codex/task-070-summary-first-harness`

## 关联模块

- `scripts/ai/`
- `scripts/coord/`
- `scripts/local-runtime/`
- `scripts/compounding_bootstrap/`
- `bootstrap/project_operator.yaml`
- `schemas/project_operator.schema.yaml`
- `templates/project_operator.template.yaml`
- `package.json`
- `tests/`
- `docs/OPERATOR_RUNBOOK.md`
- `CLAUDE.md`
- `OPENCODE.md`
- `.cursor/rules/`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：updated: docs/OPERATOR_RUNBOOK.md 与跨工具入口已随 operator assets 重生成
