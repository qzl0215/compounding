# 任务 task-040-demand-stage-visualization

## 短编号

t-040

## 目标

把仓库升级成阶段优先、价值判断优先的 AI 自主系统，用需求成熟度可视化替代 task-first 视角。

## 为什么

当前系统虽然已经有 task、release、companion 和首页决策板，但仍默认把 task 当成几乎所有事情的入口，也仍然让人过多介入执行细节。用户需要的是先判断事情成熟到哪个阶段，再决定该聊天、规划、执行还是验收。

## 范围

- 引入 `待思考 / 待规划 / 待执行 / 执行中 / 待验收 / 已发布` 六阶段模型
- 把首页从 cockpit-first 改成需求环节总图
- 把 `/tasks` 改成执行面板，并把规划类 task 与执行类 task 分开展示
- 把 `/knowledge-base` 首屏改成证据库入口，完整文档树下沉
- 调整 `/releases` 首屏顺序，优先展示当前结论、待验收状态与运行事实
- 更新 `roadmap / operating-blueprint / current-state / AGENTS / DEV_WORKFLOW / AI_OPERATING_MODEL / WORK_MODES`

## 范围外

- 不新增独立想法池文件
- 不新增数据库、orchestration UI 或新的持久化状态仓库
- 不重做 release registry、任务页明细表组件或 companion 生命周期底层模型

## 约束

- `task` 继续是执行边界，不承接未成熟需求
- 页面与 AI 对话都必须围绕同一套阶段模型行动
- 人只做价值判断、需求澄清和结果验收；AI 默认负责执行闭环
- 不新增新的首页专用真相源，只从现有主源与投影派生

## 关联模块

- `apps/studio/src/modules/portal/builders.ts`
- `apps/studio/src/modules/portal/index.ts`
- `apps/studio/src/modules/portal/module.md`
- `apps/studio/src/modules/portal/overview-items.ts`
- `apps/studio/src/modules/portal/service.ts`
- `apps/studio/src/modules/portal/stage-model.ts`
- `apps/studio/src/modules/portal/types.ts`
- `apps/studio/src/modules/portal/components/home-dashboard.tsx`
- `apps/studio/src/modules/portal/components/home-fragments.tsx`
- `apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx`
- `apps/studio/src/modules/portal/__tests__/service.test.ts`
- `apps/studio/src/modules/portal/__tests__/stage-model.test.ts`
- `apps/studio/src/app/page.tsx`
- `apps/studio/src/app/tasks/page.tsx`
- `apps/studio/src/app/releases/page.tsx`
- `apps/studio/src/app/knowledge-base/page.tsx`
- `apps/studio/src/components/shell/app-shell.tsx`
- `apps/studio/src/modules/tasks/components/delivery-table.tsx`
- `apps/studio/src/modules/tasks/__tests__/service.test.ts`
- `apps/studio/src/modules/delivery/__tests__/service.test.ts`
- `apps/studio/src/modules/docs/__tests__/repository.test.ts`
- `bootstrap/heading_aliases.json`
- `code_index/function-index.json`
- `memory/project/roadmap.md`
- `memory/project/operating-blueprint.md`
- `memory/project/current-state.md`
- `AGENTS.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `docs/WORK_MODES.md`

## 当前模式

工程执行

## 分支

`codex/task-040-demand-stage-visualization`

## 最近提交

`12a1011 feat: add stage-first demand overview`

## 交付收益

让用户先判断事情成熟到哪个环节，再决定如何对话和如何执行，减少不成熟需求误入 task、减少人被拉进代码细节，同时让首页、任务页、知识库和发布页使用同一套阶段语言。

## 交付风险

如果阶段映射规则不严，首页、任务页和发布页会再次出现口径不一致；如果规则文档改得太重，可能又制造新的说明负担。

## 一句复盘

未复盘

## 主发布版本

未生成

## 关联发布版本

无

## 计划

1. 更新 `roadmap / operating-blueprint / current-state`，补齐阶段模型和待思考/待规划分区。
2. 引入 stage-first 投影层，派生首页、任务页和知识库首屏所需的阶段项。
3. 重构首页、任务页、知识库和发布页的首屏结构与文案。
4. 收口 `AGENTS / DEV_WORKFLOW / AI_OPERATING_MODEL / WORK_MODES` 的人机分工规则。
5. 跑 lint / test / build / 校验器，生成 `dev` 预览并交付验收。

## 发布说明

本任务会改变首页、任务页、知识库和发布页的首屏信息结构，也会改变 AI 与人如何分工的规则表述，但不新增新的状态仓库或发布系统。

## 验收标准

- 首页显示六阶段中的关键阶段，并以“需求环节总图”组织信息
- `待思考` 事项不进入 task 执行面板
- `战略澄清 / 方案评审` task 出现在 `待规划`
- `todo + 工程执行` task 出现在 `待执行`
- `pending_acceptance / pending dev` 出现在 `待验收`
- `/knowledge-base` 首屏不再平铺全量任务和全量文档树
- `AGENTS / DEV_WORKFLOW / AI_OPERATING_MODEL / WORK_MODES` 对人机分工和阶段模型口径一致

## 风险

- 若阶段模型和现有 task / release 投影没有彻底对齐，会放大页面之间的状态冲突
- 若把“人只做价值判断”写成过多规则，可能反而再次限制 AI 自主性
- 若知识库首屏降噪过度，可能让人短期内找不到原来的文档入口

## 状态

doing

## 更新痕迹

- 记忆：`memory/project/current-state.md`
- 索引：`no change: stage-first projection only`
- 路线图：`memory/project/roadmap.md`, `memory/project/operating-blueprint.md`, `memory/project/current-state.md`
- 文档：`tasks/queue/task-040-demand-stage-visualization.md`, `AGENTS.md`, `docs/DEV_WORKFLOW.md`, `docs/AI_OPERATING_MODEL.md`, `docs/WORK_MODES.md`

## 复盘
