# 任务 task-052-drop-planning-task-model

## 任务摘要

- 短编号：`t-052`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  废除规划 task，保留单一 plan
- 为什么现在：
  当前 plan、规划 task 和 planning stage 三处并存，继续制造对象层歧义；需要把模糊事项彻底收回 operating-blueprint，让 task 只表示可执行结果。
- 承接边界：
  把 planning 从对象层收回为阶段动作；更新高频规则、stage model 和 task 默认 mode，不新增第二套计划系统。
- 完成定义：
  需求不清时默认回到 operating-blueprint；/tasks 只展示执行事项；planning 只来自 plan；task 不再默认落到 战略澄清/方案评审。

## 执行合同

### 要做

- 更新 AGENTS、WORK_MODES、DEV_WORKFLOW 的 planning 语义
- 调整 portal planning stage 来源
- 调整 task 默认 currentMode 与相关测试
- 同步 roadmap、current-state、operating-blueprint

### 不做

- 不重做页面结构
- 不新增 plan 页面或新状态源
- 不批量迁移历史 task 正文

### 约束

- 保留单一 plan 主源
- task 继续只表示执行合同
- planning 不再作为 task 对象类型

### 关键风险

如果默认 mode 和 stage 判定没一起改，planning 虽然从文案里删掉，产品语义仍会从 task 行和 portal 投影回流。

### 测试策略

- 为什么测：这轮同时改规则文档、task 默认 mode 和 portal stage 来源，需要锁住 planning 只来自 plan。
- 测什么：
  - portal stage-model
  - task table 排序与展示
  - 相关文档和主线状态读链
- 不测什么：
  - 不新增 UI 端到端测试
  - 不做历史 task 批量迁移测试
- 当前最小集理由：优先用现有单测锁住 stage 语义和 task 列表，避免为了这轮边界收口再引入重测试。

## 交付结果

- 状态：doing
- 体验验收结果：
  待验收
- 交付结果：
  待交付
- 复盘：
  待复盘
