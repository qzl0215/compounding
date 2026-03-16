# task-008-current-uiux-package

## 目标

产出一份单文档、长篇、可直接交给资深 UIUX AI 专家的当前 UIUX 资料包，让对方无需先通读仓库，就能理解当前产品定位、信息架构、关键页面、交互链路、内容真相源、视觉语言、问题与约束。

## 为什么

当前 UI、文档、任务、发布、Markdown 编辑与 AI 重构能力已经形成了可工作的系统，但信息散落在代码、任务和多份文档里。要让外部专家高质量重构 UIUX，需要先有一份高浓度、结构清晰、决策边界明确的资料包。

## 范围

- 汇总当前产品定位、页面结构、交互流程、视觉语言和内容真相源
- 说明首页、任务页、文档页、发布页的当前设计和职责边界
- 明确当前系统的优势、问题、重构机会点和不可破坏约束
- 形成一份单文档资料包，放入 `docs/`

## 范围外

- 不直接修改现有 UI 页面
- 不新增新的页面、组件或交互
- 不重写 prompt、任务系统或发布系统

## 约束

- 仍以当前仓库和当前 UI 实现为唯一事实来源
- 不制造新的平行真相源
- 资料包应服务于“资深 UIUX AI 专家快速理解”，而不是再写一份泛泛的品牌文案

## 关联模块

- `apps/studio/src/app/page.tsx`
- `apps/studio/src/app/tasks/page.tsx`
- `apps/studio/src/app/knowledge-base/page.tsx`
- `apps/studio/src/app/releases/page.tsx`
- `apps/studio/src/modules/portal/*`
- `apps/studio/src/modules/docs/*`
- `apps/studio/src/modules/tasks/*`
- `apps/studio/src/modules/releases/*`

## 分支

`codex/task-008-current-uiux-package`

## 最近提交

`auto: branch HEAD`

## 计划

- 盘点当前 UI 页面、内容来源、视觉语言和交互链路
- 产出一份适合外部专家阅读的单文档 UIUX 资料包
- 合入 `main`，让资料包成为当前 live docs 的一部分

## 发布说明

本次只新增资料文档，不改动运行逻辑，不影响当前本地生产页面行为。

## 验收标准

- 资料包是一份单文档长文，不需要专家先看多份分散说明
- 文档能完整说明首页、任务页、文档页、发布页的当前状态
- 文档能明确指出当前优势、问题、重构机会和不可破坏约束
- 文档路径稳定，能直接在知识库中打开

## 风险

- 若资料包写得过于抽象，会失去对专家的实际价值
- 若资料包只是罗列页面而不解释真相源与约束，会导致专家提出脱离系统边界的方案

## 状态

done

## 更新痕迹

- 记忆：`no change: 本次只补充 UIUX 资料包，不改变项目状态或经验沉淀`
- 索引：`no change: 本次不改模块边界与代码索引`
- 路线图：`no change: current priority unchanged`
- 文档：`docs/UIUX_CURRENT_PACKAGE.md`

## 复盘

- UIUX 专家最缺的不是更多页面截图，而是一份能把定位、结构、交互、真相源、约束和问题串起来的高浓度说明。
