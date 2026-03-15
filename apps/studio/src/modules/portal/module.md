# portal

## 模块目标

负责首页入口、默认阅读入口和主页摘要辅助逻辑。

## 输入

- AGENTS
- current-state
- roadmap
- git-health

## 输出

- 首页入口链接
- 默认文档路径
- 首页摘要辅助函数

## 关键职责

- 固定首页入口模型
- 提供 section 提取和状态格式化

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
- 不承载任务系统
