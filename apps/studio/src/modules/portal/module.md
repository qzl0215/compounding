# portal

## 模块目标

负责统一项目驾驶舱快照、默认阅读入口、语义总览页和首页摘要辅助逻辑。

## 输入

- AGENTS
- current-state
- roadmap
- git-health

## 输出

- 首页入口链接
- 默认文档路径
- 统一驾驶舱快照
- 文档页语义入口分组
- 首页任务摘要

## 关键职责

- 固定首页入口模型
- 从 Markdown 与 release runtime 真相源提取统一驾驶舱事实
- 把任务与运行态翻译成产品/运营可理解的话术
- 组织待办、记忆、索引和详情页的可视化入口
- 复用任务清单数据，避免首页和任务页双写逻辑
- 提供状态格式化

## 依赖

- docs 模块
- git-health 模块

## 对外暴露接口

- `DEFAULT_DOC_PATH`
- `HOME_ENTRY_LINKS`
- `getProjectCockpit`
- `getSemanticEntryGroups`
- `formatWorktreeStatus`
- `formatSyncStatus`

## 不该做什么

- 不生成平行真相源
- 不直接管理任务状态流转
- 不在首页承接发布、编辑或聊天动作
