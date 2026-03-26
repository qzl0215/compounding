# 压实跨项目脚手架最小内核

## 任务摘要

- 任务 ID：`task-071`
- 短编号：`t-071`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  压实跨项目脚手架最小内核
- 为什么现在：
  当前脚手架已能 attach/bootstrap，但还缺少 kernel profile、doctor 和多项目 archetype 适配，导致无法以低代码量稳定支撑新老项目复用。
- 承接边界：
  只做最小可复用增强：定义 kernel profile / manifest v2 最小字段、补脚手架体检入口、扩少量项目形态推断与验证；不重写 bootstrap 引擎，不引入新数据库，不大规模复制执行内核。
- 完成定义：
  新老项目都能通过更清晰的 profile 和体检入口完成 bootstrap/attach 基线验证；内核清单能表达协议层与执行层分档；测试覆盖新增场景。

## 执行合同

### 要做

- 扩 kernel manifest 和 brief/operator contract 的最小字段
- 新增脚手架体检命令与校验
- 扩展项目形态推断与最小样本测试
- 更新任务合同与必要文档痕迹

### 不做

- 不大规模迁移 summary harness/preflight/review 全部进入 kernel auto-apply
- 不新增远程服务、数据库或遥测
- 不做第二套 UI 或 bootstrap 门户

### 约束

- 控制代码量，优先复用现有 engine/attach/audit/proposal 链
- 继续遵守主源/派生产物边界
- 只补最小 profile/doctor/archetype 能力，不重写模板系统

### 关键风险

- profile 设计过早泛化会把简单脚手架做重
- 体检命令若与 audit 重复太多会变成第二套入口
- 项目形态规则过多会导致维护成本上涨

### 测试策略

- 为什么测：这轮是跨项目脚手架能力增强，必须锁住 bootstrap/attach/audit 的兼容性，并验证 profile/doctor 不会引入新漂移。
- 测什么：kernel profile 字段解析、体检输出、attach/bootstrap 项目形态推断、proposal/audit 兼容性、新老项目样本 fixture。
- 不测什么：不做真实外部仓库联网集成，不做部署平台实测。
- 当前最小集理由：优先用少量 fixture 覆盖最高风险路径，避免为了平台化引入大批新代码。

## 交付结果

- 状态：doing
- 体验验收结果：
  已补齐最小 kernel profile / capability_groups、`doctor` 体检入口和更稳的项目形态刷新逻辑；新老项目 fixture 能区分 `protocol_only`、`governance`，并给出下一步入口建议。
- 交付结果：
  新增 `doctor` 命令与最小 profile 能力后，bootstrap/attach 不再把源仓画像直接带入目标仓；当前以少量 schema/template/config/bootstrap 测试变更完成最小跨项目硬化。
- 复盘：
  这轮最容易失真的是“从本仓复制出来的 project_brief 仍保留本仓 app_type/profile”，所以实现上优先修正 refresh 判定，而不是再造更复杂的 adapter 层。

## 当前模式

工程执行

## 分支

`codex/task-071`

## 关联模块

- `scripts/compounding_bootstrap/`
- `kernel/kernel_manifest.yaml`
- `bootstrap/project_brief.yaml`
- `bootstrap/project_operator.yaml`
- `schemas/`
- `templates/`
- `examples/compounding-attach/`
- `tests/`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
