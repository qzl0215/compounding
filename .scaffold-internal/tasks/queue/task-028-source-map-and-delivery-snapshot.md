# 任务 真相源收口与交付快照统一

## 短编号

t-028

## 目标

真相源收口与交付快照统一

## 为什么

当前 AGENTS 仍承载过多重复说明，task / release / delivery 的读模型也仍在多个页面中各自推断。需要把 AGENTS 收口为高频执行主源，把 task/release/delivery 统一成单一派生交付快照，让首页、任务页、发布页读同一套事实，减少冗余和漂移。

## 范围

- 收口 `AGENTS.md`，只保留高频执行入口与真相源地图
- 新增共享 `DeliverySnapshot` 读模型，统一 task / release / runtime 的派生事实
- 让首页、任务页、发布页改为消费同一份快照

## 范围外

- 不新增新的持久化真相源
- 不重做发布模型
- 不新增新的 UI 面板或审批流

## 约束

- 不改变 release 是验收与回滚边界、task 是执行边界的原则
- 不改变 `main` / `dev` 的发布约定
- 不把快照写回成新的存量事实

## 关联模块

- `AGENTS.md`
- `apps/studio/src/modules/delivery/*`
- `apps/studio/src/modules/tasks/*`
- `apps/studio/src/modules/releases/*`
- `apps/studio/src/modules/portal/*`

## 当前模式

发布复盘

## 分支

`codex/task-028-source-map-and-delivery-snapshot`

## 最近提交

`16ba8d9 feat: unify delivery snapshot and shrink agents`

## 交付收益

减少首页、任务页、发布页之间的事实漂移，让维护者只需要读一份派生交付视图。

## 交付风险

如果 AGENTS 压缩过度，可能会丢失高频执行入口；如果快照派生不严谨，可能把重复问题从页面层转移到统一层。

## 一句复盘

把重复推断收口到一层派生快照，再把 AGENTS 缩回高频入口。

## 主发布版本

`20260318182923-16ba8d9-prod`

## 关联发布版本

无

## 计划

1. 收口 AGENTS，只保留硬规则、真相源地图和沟通契约。
2. 新增 DeliverySnapshot，统一 task / release / runtime 的派生事实。
3. 让首页、任务页、发布页改读同一套快照，并补回归测试。

## 发布说明

先走 dev 预览验收，再晋升 main 和本地 production。

## 验收标准

- AGENTS 不再重复长篇当前状态和工作模式细节
- 首页、任务页、发布页对同一条任务/发布记录显示一致状态
- `DeliverySnapshot` 能一次性提供三页所需的共享事实

## 风险

- `AGENTS` 过度压缩后，可能需要额外补源地图提示
- 共享快照若缺少字段，可能导致页面需要补回退逻辑

## 状态

done

## 更新痕迹

- 记忆：`memory/project/current-state.md`
- 索引：`code_index/module-index.md, code_index/function-index.json`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-028-source-map-and-delivery-snapshot.md`

## 复盘
