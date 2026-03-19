# 工作模式入口与 runbook 收口

## 短编号

t-031

## 目标

把规划链、执行链、交付链收口成更清晰的工作模式入口与 runbook，减少“靠经验切模式”的隐性成本。

## 为什么

当前 5 个工作模式已经存在，但更多停留在文档层。若没有更明确的入口、最小脚本契约和 runbook，高频切换仍依赖操作者经验，不利于弱 agent 和新线程稳定执行。

## 范围

- 把战略澄清 / 方案评审抽成规划链 runbook
- 把工程执行抽成执行链 runbook
- 把质量验收 / 发布复盘抽成交付链 runbook
- 优先落在 `docs/WORK_MODES.md`、`docs/DEV_WORKFLOW.md` 与必要的 `scripts/ai/*`

## 范围外

- 不重做角色系统
- 不新增新的 UI 系统
- 不引入平行工作模式文档

## 约束

- 继续复用现有 5 个工作模式，不再新增模式类别
- 入口和 runbook 必须服务于高频执行，而不是写成长文规范

## 关联模块

- `docs/WORK_MODES.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `scripts/ai/*`

## 当前模式

方案评审

## 分支

`codex/task-031-work-mode-entry-and-runbook`

## 最近提交

`auto: branch HEAD`

## 交付收益

让高频模式切换更稳定，弱 agent 也能沿统一 runbook 执行。

## 交付风险

如果 runbook 太重，会重新制造规则负担；如果过轻，又不能真正提升执行稳定性。

## 一句复盘

未复盘

## 主发布版本

未生成

## 关联发布版本

无

## 计划

1. 固定三条高频工作链的入口、输入、产物和退出条件。
2. 把高频操作压成 runbook，而不是继续写分散说明。
3. 用最小脚本契约承接模式切换。

## 发布说明

本任务是 `t-030` 之后的候选实现任务，当前仅入列，不进入执行。

## 验收标准

- 三条高频工作链的入口和 runbook 清楚
- 不新增平行角色体系
- 弱 agent 能依入口而不是依经验完成模式切换

## 风险

- 入口设计不清，会让新旧文档并存
- runbook 若脱离真实脚本契约，会再次漂移

## 状态

todo

## 更新痕迹

- 记忆：`no change: planning candidate only`
- 索引：`no change: planning candidate only`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-031-work-mode-entry-and-runbook.md`

## 复盘
