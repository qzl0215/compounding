# 任务 task-018-home-unified-cockpit

## 短编号

t-018

## 目标

把首页升级为人类优先的统一项目驾驶舱，让产品/运营负责人无需先读工程细节，也能快速理解项目是什么、当前最重要的事、推进状态、主要风险和下一步该去哪里看。

## 为什么

当前门户已经能读任务、文档和发布状态，但首页仍偏“多模块信息门户”。人类和 AI 依然需要分别穿梭多页和多份文档，才能拼出同一个项目态势。先把首页收口成同源事实的驾驶舱，才能为后续更自然的人机互动打底。

## 范围

- 新增首页统一驾驶舱 task，并把当前主线正式切到该方向
- 对齐 `AGENTS.md`、`memory/project/roadmap.md`、`memory/project/operating-blueprint.md`、`memory/project/current-state.md`
- 在 `apps/studio/src/modules/portal/*` 新增统一驾驶舱快照接口
- 首页重构为 5 个固定区块，并让每个摘要都带证据落点
- 把运行态与任务状态翻译成产品/运营可理解的话术
- 补首页数据层测试与首页渲染测试
- 更新 `docs/UIUX_CURRENT_PACKAGE.md` 与相关模块说明

## 范围外

- 不做显式 AI 视图
- 不做首页聊天入口或执行按钮
- 不新增数据库、独立读模型或后台状态表
- 不重写 `/tasks`、`/knowledge-base`、`/releases` 的核心功能

## 约束

- 继续坚持 `AGENTS + docs + memory + tasks + release runtime` 为唯一事实源
- 首页只做人类友好的投影，不制造第二套真相
- 详情页继续保留现有职责，只做必要的命名和说明统一
- 若主源冲突，先修主源，再改首页

## 关联模块

- `AGENTS.md`
- `memory/project/roadmap.md`
- `memory/project/operating-blueprint.md`
- `memory/project/current-state.md`
- `docs/UIUX_CURRENT_PACKAGE.md`
- `apps/studio/src/app/page.tsx`
- `apps/studio/src/app/tasks/page.tsx`
- `apps/studio/src/app/releases/page.tsx`
- `apps/studio/src/components/shell/app-shell.tsx`
- `apps/studio/src/modules/portal/*`

## 当前模式

发布复盘

## 分支

`codex/task-018-home-unified-cockpit`

## 最近提交

`auto: branch HEAD`

## 交付收益

把项目主线、推进状态、风险与证据入口收口到一个人类优先窗口，降低高层理解成本，也为后续 AI 复用同一快照接口打底。

## 交付风险

如果首页只改视觉不改事实抽取，会把主源冲突直接放大；如果过度改写详情页，又会让驾驶舱和详情页重新分叉。

## 计划

1. 新增 task 并对齐主源文档，把驾驶舱写成正式当前方向。
2. 重构 `portal` 数据层，新增统一驾驶舱快照接口和人类化状态翻译。
3. 把首页收口为 5 个固定区块，并下钻到任务、文档、发布和主源文档。
4. 用测试锁住快照结构、状态翻译和首页区块稳定性。
5. 回写 UIUX 资料包、模块说明和索引。

## 发布说明

本任务已完成本地门户的信息架构与首页表现升级，不增加新的执行动作；详情页继续承接原有任务、文档和发布操作。本轮尚未生成新的 `dev` 预览。

## 验收标准

- 首页固定呈现 5 个高价值区块，而不是继续并列堆模块
- `AGENTS`、`roadmap`、`operating-blueprint`、`current-state` 对当前主线描述一致
- 首页每个摘要都能下钻到对应 task、memory、docs 或 `/releases`
- 任务与运行态摘要默认使用产品/运营可理解的话术
- `/tasks`、`/knowledge-base`、`/releases` 保持详情页职责，不出现新的平行真相源

## 风险

- 若主源文档更新不完整，首页会继续展示冲突信息
- 若状态翻译过度简化，可能掩盖真实技术风险
- 若首页承担过多解释职责，会重新膨胀成另一种长文入口

## 状态

done

## 更新痕迹

- 记忆：`memory/project/roadmap.md`, `memory/project/operating-blueprint.md`, `memory/project/current-state.md`
- 索引：`code_index/module-index.md`, `code_index/function-index.json`
- 路线图：`memory/project/roadmap.md`
- 文档：`AGENTS.md`, `docs/UIUX_CURRENT_PACKAGE.md`, `apps/studio/src/modules/portal/module.md`, `tasks/queue/task-018-home-unified-cockpit.md`

## 一句复盘

统一驾驶舱的第一性原则不是把更多信息塞进首页，而是让同一套事实更快被人看懂。

## 复盘

- 先对齐主源，再改首页，是避免“页面更好看但事实更冲突”的必要顺序。
- 把首页改成统一快照接口后，后续若要加 AI 视图或互动入口，可以复用同一层事实抽取而不必重新拼首页数据。
- 当前改动已经并入 `main` 后，task 状态也必须同步进入 `done`，否则 task/Git 校验会继续把它识别成未收尾任务。
