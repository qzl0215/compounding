# 首页简化为决策板

## 短编号

t-037

## 父计划

`memory/project/operating-blueprint.md`

## 目标

把运营后台首页收口为决策板，只保留当前阶段、运行与发布、当前阻塞与下一步。

## 为什么

首页现在承载的信息过多，重复了任务页、发布页和知识库的细节，不利于快速判断现状。需要把首页收口为最小决策面，只让人先判断局面，再决定去哪里下钻。

## 范围

- 保留一个极短的项目引导语，但不再保留完整“项目是什么”说明卡
- 首页只保留 3 个核心区块：
  - 当前状态
  - 运行与发布
  - 当前阻塞与下一步
- 保留少量快捷入口，优先指向任务页、发布页和当前状态
- 只调整首页信息结构与默认展示密度，不改任务页、发布页或知识库的详情承载职责

## 承接边界

本任务只承接“首页从统一驾驶舱收口为决策板”的表达层和信息层收缩，不改阶段模型本身，也不改任务页、发布页与知识库的职责边界。

## 范围外

- 不改任务页的信息密度
- 不改发布页的信息密度
- 不改知识库原文与主源结构
- 不引入新的首页专用状态源

## 约束

- 继续只从现有 `ProjectOverviewSnapshot` 派生页面展示
- 继续沿用 `current-state`、`roadmap`、`operating-blueprint`、`DeliverySnapshot` 与 release runtime
- 首页只做重新投影，不再承担详情工作台职责

## 测试策略

- 为什么测：首页改的是信息层级和首屏取舍，最容易出现重复卡片和入口丢失
- 测什么：首页渲染、首屏文案、任务页/发布页入口是否仍可达
- 不测什么：不测任务页和发布页的内容密度，不改各自详情结构
- 当前最小集理由：先锁住首页判断链，避免再次长回详情工作台

## 关联模块

- `apps/studio/src/modules/portal/components/home-dashboard.tsx`
- `apps/studio/src/modules/portal/components/home-fragments.tsx`
- `apps/studio/src/modules/portal/service.ts`
- `apps/studio/src/modules/portal/builders.ts`
- `apps/studio/src/modules/portal/types.ts`
- `apps/studio/src/components/shell/app-shell.tsx`
- `apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx`
- `apps/studio/src/modules/portal/__tests__/service.test.ts`
- `memory/project/current-state.md`
- `memory/project/roadmap.md`
- `memory/project/operating-blueprint.md`

## 当前模式

发布复盘

## 分支

`codex/task-037-homepage-decision-board`

## 最近提交

`2819921`

## 交付收益

让首页从“统一驾驶舱”收口成“决策板”，用户第一眼就能看到阶段、运行态、阻塞与下一步，而不用先翻证据和任务明细。

## 交付风险

如果首页收得太狠，可能让人失去基本跳转入口；如果保留过多说明，又会重新变回详情工作台。

## 一句复盘

首页已收口为决策板，本轮补齐任务伴随体的计划文件边界，消掉 pre-task 的 scope warning。

## 主发布版本

`20260319214718-117928e-prod`

## 关联发布版本

无

## 计划

1. 收口首页首屏，只保留判断现状所需的最小信息。
2. 保留任务页、发布页和当前状态的快捷入口。
3. 让首页继续使用同一套 `ProjectOverviewSnapshot` 派生事实，不新增首页专用状态。

## 发布说明

本任务已并入 main，首页已改为决策板布局；本轮补齐 companion 的计划文件边界，并修正任务台账里的测试路径。

## 验收标准

- 首页第一眼只能看到最重要的信息，不需要滚动就能判断当前阶段、当前阻塞、当前运行态与下一步
- 首页不再出现大段使命愿景说明卡、证据入口网格或任务列表详情平铺
- 任务页、发布页、知识库的现有信息不被破坏
- 首页仍然从同一套 cockpit / snapshot 真相源取值，不引入新的数据来源

## 风险

- 如果首页只剩结果而没有入口，会降低下钻效率
- 如果主页继续放太多说明，会再次回到“详情工作台”的问题

## 状态

done

## 更新痕迹

- 记忆：`no change: title wording refinement only`
- 索引：`no change: title wording refinement only`
- 路线图：`no change: title wording refinement only`
- 文档：`tasks/queue/task-037-homepage-decision-board.md, apps/studio/src/components/shell/app-shell.tsx, apps/studio/src/modules/portal/components/home-dashboard.tsx, apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx, apps/studio/src/modules/portal/__tests__/service.test.ts`

## 复盘

- 首页已收口为决策板；伴随体里的 planned_files 也必须与真实改动对齐，否则 pre-task 仍会留下低价值噪音。
