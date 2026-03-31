# 接入 OpenSpec 作为仓内规范层

## 任务摘要

- 任务 ID：`task-090`
- 短编号：`t-090`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  接入 OpenSpec 作为仓内规范层
- 为什么现在：
  仓库已经有 task / companion / release / memory 的主治理链，但还缺一层可追溯的规范包来承载“能力级 spec、变更提案、设计与任务清单”；把 OpenSpec 接进来可以补足规范层，同时避免把 plan、task 和 release 再拆成另一套流程。
- 承接边界：
  只落 OpenSpec 的仓内兼容层、适配说明、pilot capability 与一致性校验入口；不改 task 状态机、不改 release 流、不把 OpenSpec 变成新的 plan 主源。
- 完成定义：
  仓内存在 `openspec/project.md`、`openspec/specs/`、`openspec/changes/` 与归档目录；至少一个 pilot capability 能跑通 proposal → tasks → implementation → archive 的闭环；有一个只做一致性检查的命令或脚本，能验证 OpenSpec 变更包与本仓 task 合同的映射关系；相关文档与测试通过。
- 交付轨道：`direct_merge`

## 执行合同

### 要做

- 创建 `openspec/project.md`，写清 OpenSpec 在本仓的定位、适用场景、不适用场景和与 `AGENTS.md` / `operating-blueprint` / `tasks/queue` 的关系。
- 建立 `openspec/specs/<capability>/spec.md` 的能力级规范目录，先落一个 pilot capability。
- 建立 `openspec/changes/<slug>/` 变更包目录，包含 proposal / design / tasks / spec delta。
- 建立 `openspec/changes/archive/` 归档目录约定。
- 增加一个只做一致性检查的命令或脚本，用来校验 OpenSpec 变更包与本仓 task 合同的一致性。
- 视需要给 `AGENTS.md` 或 `docs/AI_OPERATING_MODEL.md` 补一条 OpenSpec 作为规范层的使用边界。

### 不做

- 不把 OpenSpec 变成新的 plan 主源。
- 不重写 `kernel/task-state-machine.yaml`。
- 不新增数据库、后台服务或第二套任务系统。
- 不替换 `tasks/queue/*`、`memory/project/operating-blueprint.md` 或 `AGENTS.md` 的主源地位。

### 约束

- OpenSpec 只负责规范与变更的结构化表达，不接管 task 状态机、release 流或 project memory。
- pilot capability 先只落一个，验证完再考虑扩展到更多能力族。
- OpenSpec 变更包与仓内 task 合同必须能互相追溯，但不能互相替代。

### 关键风险

- 如果 OpenSpec 的目录被当成第二套计划系统，仓库会重新长出并行主源。
- 如果没有一致性检查，变更包会慢慢退化成只读文档。
- 如果 pilot capability 选得太散，落地会失去可验证性。

### 测试策略

- 为什么测：
  这轮新增的是规范层与一致性边界，最容易出问题的是目录结构、主源边界和任务映射。
- 测什么：
  - OpenSpec 目录与适配说明是否存在
  - pilot capability 的 spec / change package 是否可追溯
  - 一致性检查命令是否能捕获 task 合同与变更包不一致
  - `pnpm validate:static`
- 不测什么：
  - 不重写 release runtime 流
  - 不测试 OpenSpec 外部 CLI 本身
  - 不扩大到多个 capability
- 当前最小集理由：
  先把 OpenSpec 变成仓内规范层的“可追溯容器”，再决定是否扩展成更完整的工作流入口。

## 交付结果

- 状态：todo
- 体验验收结果：待补
- 交付结果：待补
- 复盘：待补

## 分支

`codex/task-090-openspec-adoption`

## 关联模块

- `openspec/`
- `AGENTS.md`
- `docs/AI_OPERATING_MODEL.md`
- `memory/project/operating-blueprint.md`
- `tasks/queue/`

## 更新痕迹

- 记忆：no change
- 索引：no change
- 路线图：no change
- 文档：待补
