# portal

## 模块目标

负责统一项目需求环节总图、默认阅读入口、证据入口分组和首页阶段投影逻辑。

## 输入

- AGENTS
- current-state
- roadmap
- operating-blueprint
- delivery snapshot
- release runtime

## 输出

- 首页入口链接
- 默认文档路径
- 需求环节总图快照
- 证据库精选入口分组
- 首页与任务页共享的阶段判断

## 关键职责

- 固定 stage-first 首页入口模型
- 从 Markdown 与 release runtime 真相源提取需求环节事实
- 把任务、规划和运行态翻译成人类优先的话术
- 给知识库提供精选证据入口，而不是重新堆全量目录
- 复用任务清单数据，避免首页和任务页双写阶段逻辑
- 提供状态格式化

## 依赖

- docs 模块
- git-health 模块

## 对外暴露接口

- `DEFAULT_DOC_PATH`
- `HOME_ENTRY_LINKS`
- `getProjectOverview`
- `getProjectCockpit`
- `getSemanticEntryGroups`
- `formatWorktreeStatus`
- `formatSyncStatus`

## 不该做什么

- 不生成平行真相源
- 不直接管理任务状态流转
- 不在首页承接发布、编辑或聊天动作
