# portal

## 模块目标

负责首页入口、默认阅读入口、语义总览页和主页摘要辅助逻辑。

## 输入

- AGENTS
- current-state
- roadmap
- git-health

## 输出

- 首页入口链接
- 默认文档路径
- 首页语义摘要
- 文档页语义入口分组
- 首页任务摘要

## 关键职责

- 固定首页入口模型
- 从 Markdown 真相源提取总览信息
- 组织待办、记忆、索引和职责的可视化入口
- 复用任务清单数据，避免首页和任务页双写逻辑
- 提供状态格式化

## 依赖

- docs 模块
- git-health 模块

## 对外暴露接口

- `DEFAULT_DOC_PATH`
- `HOME_ENTRY_LINKS`
- `extractSection`
- `formatWorktreeStatus`
- `formatSyncStatus`

## 不该做什么

- 不读取 git
- 不直接读文件
- 不直接管理任务状态流转
