# 建立治理回写闭环协议

## 任务摘要

- 任务 ID：`task-095`
- 短编号：`t-095`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  建立治理回写闭环协议
- 为什么现在：
  治理类 task 已能合法承接 gap，但完成后缺少固定 truth 归口，继续执行会把真相回写退化成约定。
- 承接边界：
  只覆盖治理控制面的 Task -> Consolidation -> Truth 闭环；补 writeback_targets 兑现校验、归口矩阵和 task 结果表达；不扩到业务模块，不新增状态机状态。
- 完成定义：
  治理类 task 声明 Current/Tests 这类回写目标后，若未兑现对应 truth sink，将无法通过静态校验；主源文档已明确最小归口矩阵。
- 交付轨道：`direct_merge`

## 治理绑定

- 主治理差距：`GOV-GAP-04`
- 来源断言：`A7`
- 回写目标：
  - `Current`
  - `Tests`

## 执行合同

### 要做

- 固定治理控制面的 writeback target 归口
- 扩 `validate-task-git` 做文件级兑现校验
- 收紧 task 结果区与 update trace 的回写表达
- 回写 `operating-blueprint`、`current-state` 与治理 gap backlog
- 补最小测试覆盖

### 不做

- 不扩业务模块 task
- 不新增 state machine 状态
- 不实现 Assertion -> Guard 映射
- 不启用 `Controlled Facts` 作为真实归口

### 约束

- 只允许 `Current`、`Code Index`、`Tests` 作为本轮真实归口
- 治理类 task done 不再等于代码改完，必须等于回写目标已兑现
- 不新增第二套状态源或 consolidation 文档族

### 关键风险

- 若治理类 task 识别过宽，会误伤存量非治理 task
- 若只做 task 正文约束，不做 gate 校验，回写闭环会退化成说明文字
- 若 `Current` 与 `operating-blueprint` 混层，会重新制造并列真相

### 测试策略

- 为什么测：这是治理闭环从 task 合法承接走向 truth 收敛的第一轮，需要证明声明的回写目标会被真正兑现。
- 测什么：validate-task-git 行为、task 合同解析/读模型、治理 task 场景测试、知识资产与 docs repository 回归。
- 不测什么：不扩业务模块批量迁移；不做 review UI 改版；不做更重的语义回写推断。
- 当前最小集理由：先锁文件级兑现校验，防止完全不回写，再逐轮增强质量判断。

## 交付结果

- 状态：doing
- 体验验收结果：
  待评审；本轮先完成治理控制面的合同、gate 与主源回写，业务模块推广留给后续。
- 交付结果：
  治理类 task 的 `writeback_targets` 已升级成可校验合同；`validate-task-git` 会校验 `Current / Code Index / Tests` 是否命中真实 sink，`operating-blueprint` 与 `current-state` 也已回写对应协议与现状。
- 复盘：
  `writeback_targets` 只靠 task 正文声明不够，必须同步进入 gate 与主源，否则仍会退化成补丁式约定。

## 分支

`codex/task-095-writeback-consolidation`

## 关联模块

- `scripts/ai/create-task.ts`
- `scripts/ai/validate-task-git-link.ts`
- `tests/coord_support.py`
- `tests/test_coord_cli.py`
- `memory/project/operating-blueprint.md`
- `memory/project/current-state.md`
- `memory/project/governance-gaps.md`

## 更新痕迹

- 记忆：memory/project/current-state.md
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：memory/project/operating-blueprint.md
