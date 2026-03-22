# portal

## 模块目标

负责统一项目需求总览首页、默认阅读入口、证据入口分组和 stage-first 首页投影逻辑。

## 输入

- AGENTS
- current-state
- roadmap
- operating-blueprint
- delivery snapshot
- release runtime

## 输出

- 首页总览入口
- 默认文档路径
- 需求环节快照与首页总览投影
- 证据库精选入口分组
- 首页与任务页共享的阶段判断

## 关键职责

- 固定“首页只保留需求总览 + 下钻页承接细节”的入口模型
- 从 Markdown 与 release runtime 真相源提取需求环节事实
- 把任务、规划和运行态翻译成人类优先的经营判断
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
