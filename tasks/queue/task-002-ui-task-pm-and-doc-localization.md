# 任务 task-002-ui-task-pm-and-doc-localization

## 短编号

t-002

## 目标

把 live 文档标题中文化，补齐全站粘性右侧导航，并把现有 `tasks/*` 升级成轻量项目管理清单。

## 为什么

当前页面仍有不少英文主标题，右侧导航只在单页局部存在，task 体系也还偏“有文件但不好管理”。这会增加阅读成本，削弱高效组织和持续抓重点的执行力。

## 范围

- live 文档的 `# / ##` 标题中文友好化
- 首页、任务页、文档页、发布页统一右侧粘性导航
- 新增 `/tasks` 页面
- task 模板和 task parser 收口为轻量项目管理清单
- 新增 `validate-change-trace` 自动校验

## 范围外

- 改变 `main` 直发生产与 rollback 模型
- 新增数据库、编辑器、复杂后台系统
- 引入参考项目里的重型 lane / PR / branch 制度

## 约束

- Markdown 仍是真相源
- 不新增平行文档体系
- roadmap 仅在主线变化时更新
- 保持页面入口只有首页 / 任务 / 文档 / 发布

## 关联模块

- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/portal`
- `apps/studio/src/modules/tasks`
- `apps/studio/src/modules/releases`
- `scripts/ai/*`
- `scripts/compounding_bootstrap/*`

## 当前模式

发布复盘

## 分支

`main (legacy direct release)`

## 最近提交

`0316b85`

## 交付收益

统一任务、界面与文档的中文表达，降低人和 AI 在产品语义上的理解摩擦。

## 交付风险

如果只是翻译文本而不统一规则口径，后续仍会重新长回中英混写和表述分裂。

## 一句复盘

语言统一不是润色工作，而是降低协作歧义的结构性投资。

## 计划

- 先统一标题别名和 task parser
- 再补 `/tasks` 页面与全站粘性目录
- 最后接入自动校验和文档中文化回归测试

## 发布说明

这轮主要是 UI 与文档结构改动，不涉及发布模型切换；上线前以 `pnpm build` 与 `bootstrap:audit` 为主验收。

## 验收标准

- live 文档 `# / ##` 标题中文友好，现有摘要解析仍然正常
- `/`、`/tasks`、`/knowledge-base`、`/releases` 都有右侧粘性导航
- `/tasks` 可按 `todo / doing / blocked / done` 查看任务
- task 模板带“更新痕迹”，并有自动校验脚本兜底
- `pnpm lint`、`pnpm test`、`pnpm build`、`bootstrap:audit` 通过

## 风险

- 标题中文化后，旧的英文解析逻辑可能失效
- 右侧导航共享化后，长页布局可能出现回归
- task 闭环如果要求过重，容易反向长出管理负担

## 状态

done

## 更新痕迹

- 记忆：`no change: historical task metadata alignment only`
- 索引：`no change: historical task metadata alignment only`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-002-ui-task-pm-and-doc-localization.md`

## 复盘

任务系统和标题中文化已经落地，但首页经营驾驶舱和认知分层仍需要后续任务继续收口。
