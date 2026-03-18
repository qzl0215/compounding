# 任务 真相源收口与交付快照再收敛

## 短编号

t-029

## 目标

真相源收口与交付快照再收敛

## 为什么

当前 `roadmap` 与 `current-state` 仍重复讲部分阶段与优先级事实，任务页、发布页、首页也还在各自拼装交付状态。需要把 `roadmap` 彻底收回战略真相，把 `current-state` 彻底收回运营快照，并让首页、任务页、发布页统一消费同一份派生交付快照，减少重复和漂移。

## 范围

- 收口 `AGENTS.md`，只保留高频执行主源、真相源地图和回复契约
- 让 `memory/project/roadmap.md` 只承载战略真相
- 让 `memory/project/current-state.md` 只承载运营快照
- 收紧 `DeliverySnapshot`，统一 task / release / runtime 的派生事实
- 抽出任务页与发布页重复的 release action helper

## 范围外

- 不新增新的持久化真相源
- 不重做发布模型
- 不额外新增 UI 面板或审批流

## 约束

- 不改变 release 是验收与回滚边界、task 是执行边界的原则
- 不改变 `main` / `dev` 的发布约定
- 不把派生快照写回成新的存量事实

## 关联模块

- `AGENTS.md`
- `memory/project/roadmap.md`
- `memory/project/current-state.md`
- `apps/studio/src/modules/delivery/*`
- `apps/studio/src/modules/tasks/*`
- `apps/studio/src/modules/releases/*`
- `apps/studio/src/modules/portal/*`

## 当前模式

发布复盘

## 分支

`codex/task-029-truth-source-and-delivery-snapshot`

## 最近提交

`7fe44ef`

## 交付收益

让战略真相、运营快照和交付视图各归其位，减少首页、任务页、发布页之间的事实漂移。

## 交付风险

如果收口过度，可能把原本清晰的入口缩得太薄；如果派生快照过胖，重复问题只是换了一层外壳。

## 一句复盘

把 roadmap/current-state 的职责分开，再把交付事实统一投影到一层快照里。

## 主发布版本

`20260318190450-7fe44ef-prod`

## 关联发布版本

`20260318185730-7fe44ef-dev`

## 计划

1. 收口 `AGENTS.md` 与 `memory/project/current-state.md`，删除重复的战略口径。
2. 收紧 `DeliverySnapshot`，让页面只消费统一派生快照。
3. 抽出任务页与发布页重复的 release action helper，并补一致性测试。

## 发布说明

先走 dev 预览验收，再晋升 main 和本地 production。

## 验收标准

- `roadmap` 只讲战略真相，`current-state` 只讲运营快照
- 首页、任务页、发布页对同一条任务 / 发布记录显示一致状态
- 任务页和发布页不再各自重复实现 release action 处理逻辑
- `DeliverySnapshot` 仍只做派生，不成为新的持久化真相源

## 风险

- `AGENTS` 如果压得过薄，可能需要额外补源地图提示
- 共享快照若缺少字段，页面可能需要少量回退逻辑

## 状态

done

## 更新痕迹

- 记忆：`memory/project/current-state.md`
- 索引：`no change: this closeout only updates task and current-state`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-029-truth-source-and-delivery-snapshot.md`

## 复盘

`roadmap` / `current-state` / `DeliverySnapshot` 的边界收口后，首页、任务页、发布页的事实口径一致了。
