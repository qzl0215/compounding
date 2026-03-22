# delivery

## 模块目标

负责把任务板、release 面板和当前 diff 汇总成一份可交付快照，供首页与交付页统一读取。

## 输入

- `tasks/queue/*.md`
- `agent-coordination/tasks/*.json`
- release registry 与当前运行态
- 当前 Git diff

## 输出

- delivery snapshot
- 任务交付投影视图
- diff-aware QA / Review / Retro 摘要

## 关键职责

- 汇总任务数据与 release dashboard
- 把当前 diff 归类成可解释的风险与检查建议
- 生成交付页需要的 task rows 与 task options
- 把范围、review、retro 与 ship log 压成一份轻量快照

## 依赖

- `tasks` 模块
- `releases` 模块
- Git 工作区状态

## 对外暴露接口

- `getDeliverySnapshot`
- `collectDiffAwareArtifact`
- `buildDiffAwareArtifactFromFiles`

## 不该做什么

- 不直接写 task 或 release 主状态
- 不负责真正执行发布动作
- 不把 diff 摘要扩张成新的治理主源
