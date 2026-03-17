# 任务 task-017-delivery-batch-model

## 短编号

t-017


## 目标

把任务与发布关系升级为交付批次模型，并把任务页改成高密度交付摘要表。


## 为什么

当前 task 与 release 关系过于机械，任务页也偏工程明细，不利于人快速判断收益、风险、状态与可介入动作。


## 范围

## 范围外

## 约束

## 关联模块

## 当前模式

质量验收


## 分支

`codex/task-017-delivery-batch-model`


## 最近提交

`auto: branch HEAD`

## 交付收益

把任务页从工程明细视角升级为交付摘要视角，让人能更快判断收益、风险、状态、版本与可介入动作。

## 交付风险

任务与 release 的关联模型如果设计不清，容易让任务页、发布页和 release registry 再次出现双真相源或状态漂移。

## 一句复盘

未复盘

## 主发布版本

未生成

## 关联发布版本

无

## 计划

1. 为 release registry 增加主 task、辅助 task 与交付摘要字段。
2. 把 `/tasks` 改成默认看交付摘要、展开看工程明细的高密度表格。
3. 让 `/releases` 在创建 dev 时显式绑定主 task，并能展示交付批次信息。

## 发布说明

本任务先生成 `dev` 预览供人工验收；只有验收通过后，才会晋升到 `main` 与本地 production。

## 验收标准

- 一个 release 默认绑定 1 个主 task，可选少量辅助 task
- `/tasks` 默认展示任务摘要、收益、风险、状态、版本、复盘与强操作
- `/releases` 创建 dev 时必须显式绑定主 task
- 任务页与发布页读取同一份 release registry 关联信息

## 风险

- 过度强调 release 维度，可能削弱 task 作为执行边界的作用
- 若任务页动作过多，容易和发布页职责重叠
- 若旧任务缺少交付摘要字段，列表可能出现大量低质量占位信息

## 状态

doing

## 更新痕迹

- 记忆：`memory/project/current-state.md`, `memory/project/operating-blueprint.md`
- 索引：`no change: no index impact yet`
- 路线图：`memory/project/roadmap.md`
- 文档：`AGENTS.md`, `docs/PROJECT_RULES.md`, `docs/DEV_WORKFLOW.md`, `docs/AI_OPERATING_MODEL.md`, `tasks/templates/task-template.md`, `tasks/queue/task-017-delivery-batch-model.md`

## 复盘
