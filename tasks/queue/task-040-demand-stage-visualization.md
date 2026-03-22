# 任务 task-040-demand-stage-visualization

## 短编号

t-040

## 目标

把仓库升级成阶段优先、价值判断优先的 AI 自主系统，用需求成熟度可视化替代 task-first 视角。

## 为什么

当前系统虽然已经有 task、release、companion 和首页决策板，但仍默认把 task 当成几乎所有事情的入口，也仍然让人过多介入执行细节。用户需要的是先判断事情成熟到哪个阶段，再决定该聊天、规划、执行还是验收。

## 范围

- 引入 `待思考 / 待规划 / 待执行 / 执行中 / 待验收 / 已发布` 六阶段模型
- 把首页收口成只保留“需求总览”的 summary projection
- 把 `/tasks` 改成执行面板，并把规划类 task 与执行类 task 分开展示
- 把 `/knowledge-base` 首屏改成证据库入口，完整文档树下沉
- 调整 `/releases` 首屏顺序，优先展示当前结论、待验收状态与运行事实
- 把 `operating-blueprint` 固定为唯一 plan 主源，并把 `roadmap` 收成战略摘要
- 更新 `roadmap / operating-blueprint / current-state / AGENTS / DEV_WORKFLOW / AI_OPERATING_MODEL / WORK_MODES`
- 补齐 task 模板、task 解析与校验器对 `父计划 / 计划快照 / 体验验收结果 / 测试策略` 的识别

## 范围外

- 不新增独立想法池文件
- 不新增数据库、orchestration UI 或新的持久化状态仓库
- 不重做 release registry、任务页明细表组件或 companion 生命周期底层模型
- 不新增第二层 plan、plan 页面或第二套工单系统

## 约束

- `task` 继续是执行边界，不承接未成熟需求
- 页面与 AI 对话都必须围绕同一套阶段模型行动
- 人只做价值判断、需求澄清和结果验收；AI 默认负责执行闭环
- 不新增新的首页专用真相源，只从现有主源与投影派生
- `operating-blueprint` 是唯一 plan 主源；`roadmap` 不再并行写第二份计划
- test 采用风险驱动最小集，不以数量换安全感

## 父计划

`memory/project/operating-blueprint.md`

## 计划快照

把当前项目收口成单层 Plan、阶段优先、价值判断优先的 AI 自主系统：`operating-blueprint` 负责唯一 plan，AI 先扩选项、再收决策、最后产出 task 并对准体验级验收结果。

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
- `apps/studio/src/app/layout.tsx`
- `apps/studio/src/components/shell/app-shell.tsx`
- `apps/studio/src/modules/tasks/components/delivery-table.tsx`
- `apps/studio/src/modules/tasks/components/delivery-table-row.tsx`
- `apps/studio/src/modules/tasks/parsing.ts`
- `apps/studio/src/modules/tasks/types.ts`
- `apps/studio/src/modules/tasks/__tests__/service.test.ts`
- `apps/studio/src/modules/delivery/__tests__/service.test.ts`
- `apps/studio/src/modules/docs/__tests__/repository.test.ts`
- `apps/studio/src/modules/docs/ai-rewrite-context.ts`
- `bootstrap/heading_aliases.json`
- `code_index/function-index.json`
- `memory/project/roadmap.md`
- `memory/project/operating-blueprint.md`
- `memory/project/current-state.md`
- `AGENTS.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `docs/WORK_MODES.md`
- `scripts/ai/create-task.ts`
- `scripts/ai/validate-change-trace.ts`
- `tasks/templates/task-template.md`

## 当前模式

工程执行

## 分支

`codex/task-040-demand-stage-visualization`

## 最近提交

`auto: branch HEAD`

## 交付收益

让用户先判断事情成熟到哪个环节，再决定如何对话和如何执行，减少不成熟需求误入 task、减少人被拉进代码细节，同时让首页、任务页、知识库和发布页使用同一套阶段语言。

## 交付风险

如果阶段映射规则不严，首页、任务页和发布页会再次出现口径不一致；如果规则文档改得太重，可能又制造新的说明负担。

## 一句复盘

阶段投影已稳定，当前收口重点从“多区块说明”改成“单层 plan + 首页只保留需求总览”，让表达和执行边界一起变短。

## 体验验收结果

待验收：判断首页是否只保留需求总览；判断 AI 是否先扩选项、再收决策、最后才进入 task；判断测试策略是否写成风险驱动最小集，而不是泛化成更多门禁。

## 测试策略

- 文档主源：验证 `operating-blueprint / roadmap / current-state / AGENTS / DEV_WORKFLOW / AI_OPERATING_MODEL / WORK_MODES` 口径一致
- task 契约：验证模板、create-task、task parsing、校验器都认识 `父计划 / 计划快照 / 体验验收结果 / 测试策略`
- 页面投影：验证首页只保留需求总览，任务页和发布页继续承接详情
- 不新增重复测试；优先依赖现有 lint / test / build / preview check

## 主发布版本

未生成

## 关联发布版本

无

## 计划

1. 固定单层 plan：让 `operating-blueprint` 成为唯一 plan 主源，`roadmap` 只保留战略摘要与里程碑。
2. 固定 AI 对话顺序：先扩选项，再收关键决策，最后才产出 task。
3. 收口首页：只保留需求总览，不再平铺阶段详情；细节下沉到任务页、发布页和证据库。
4. 补齐 task 契约与 test 治理：新增 `父计划 / 计划快照 / 体验验收结果 / 测试策略`，并明确风险驱动最小测试集。
5. 跑 lint / test / build / 校验器，并准备新的 `dev` 预览作为验收基线。

## 发布说明

本任务会改变首页、任务页、知识库和发布页的首屏信息结构，也会改变 AI 与人如何分工、如何进入 task 和如何定义测试策略的规则表述，但不新增新的状态仓库或发布系统。

## 验收标准

- 首页只保留需求总览，不重新长成详情工作台
- `operating-blueprint` 成为唯一 plan 主源，`roadmap` 不再并行写计划
- `待思考` 事项不进入 task 执行面板
- `战略澄清 / 方案评审` task 出现在 `待规划`
- `todo + 工程执行` task 出现在 `待执行`
- `pending_acceptance / pending dev` 出现在 `待验收`
- `/knowledge-base` 首屏不再平铺全量任务和全量文档树
- `AGENTS / DEV_WORKFLOW / AI_OPERATING_MODEL / WORK_MODES` 对“单层 plan + AI 先扩选项再收决策 + 风险驱动测试策略”口径一致
- task 模板、task 解析和校验器都识别 `父计划 / 计划快照 / 体验验收结果 / 测试策略`

## 风险

- 若阶段模型和现有 task / release 投影没有彻底对齐，会放大页面之间的状态冲突
- 若把“人只做价值判断”写成过多规则，可能反而再次限制 AI 自主性
- 若知识库首屏降噪过度，可能让人短期内找不到原来的文档入口

## 状态

doing

## 更新痕迹

- 记忆：`memory/project/operating-blueprint.md`, `memory/project/current-state.md`
- 索引：`no change: current code index already covers the touched modules`
- 路线图：`memory/project/roadmap.md`
- 文档：`AGENTS.md`, `docs/DEV_WORKFLOW.md`, `docs/AI_OPERATING_MODEL.md`, `docs/WORK_MODES.md`, `tasks/templates/task-template.md`, `tasks/queue/task-040-demand-stage-visualization.md`, `apps/studio/src/modules/portal/module.md`

## 复盘
