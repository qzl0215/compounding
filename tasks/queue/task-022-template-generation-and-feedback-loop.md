# 任务 task-022-template-generation-and-feedback-loop

## 短编号

t-022

## 目标

建立“模板生成防漂移 + 工具体验反馈闭环”机制，让关键资产一致性和经验沉淀可持续运行。

## 为什么

规则与执行文档最容易在迭代中漂移；同时，执行过程中的真实摩擦若不结构化沉淀，难以转化为可复用改进。

## 范围

- 选定至少 1 类关键资产改造为“模板 -> 生成 -> 校验”链路
- 定义工具体验反馈的记录结构与晋升路径（experience -> docs/AGENTS）
- 把反馈闭环绑定到任务复盘与记忆更新流程

## 范围外

- 不一次性改造所有文档资产
- 不引入独立反馈平台或外部系统

## 约束

- 生成产物不承载判断性内容，判断仍由主源文档维护
- 反馈沉淀优先写入 `memory/experience/*`，稳定后再晋升

## 关联模块

- `docs/ASSET_MAINTENANCE.md`
- `docs/AI_OPERATING_MODEL.md`
- `memory/experience/*`
- `tasks/queue/task-022-template-generation-and-feedback-loop.md`

## 当前模式

方案评审

## 分支

`codex/task-022-template-generation-and-feedback-loop`

## 最近提交

`auto: branch HEAD`

## 交付收益

降低文档/规则漂移概率，并把执行痛点系统化转化为持续改进资产。

## 交付风险

若选错试点资产，短期收益不明显；若反馈结构过重，团队不愿持续填写。

## 计划

1. 选择高频且易漂移资产作为模板化试点。
2. 实现最小生成链路与一致性校验。
3. 定义反馈记录与晋升标准，并在真实任务中试跑。

## 发布说明

本任务先做最小闭环试点，后续按收益扩展覆盖范围。

## 验收标准

- 至少 1 类资产完成模板化与校验接入
- 反馈闭环有统一结构且在真实任务中可执行
- 经验沉淀与规则晋升路径清晰且可追踪

## 风险

- 模板化收益不足时容易被中断
- 反馈闭环只记录不消费，形成形式主义

## 状态

todo

## 更新痕迹

- 记忆：`memory/project/operating-blueprint.md`
- 索引：`no change: 本轮仅新增任务编排`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-022-template-generation-and-feedback-loop.md`

## 一句复盘

未复盘
