---
title: OPERATING_BLUEPRINT
doc_role: planning
update_mode: manual
owner_role: PMO
status: active
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/current-state.md
  - tasks/queue/task-001-repo-refactor.md
last_reviewed_at: 2026-03-15
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

经营驾驶舱首页与认知分层收口

## 关键子目标

### 首页经营驾驶舱

- 发布标准：
  - 首页固定为 5 个高浓度模块，且无右侧导航
  - 首页本身承担阅读顺序和导航作用
- 关联任务：
  - `tasks/queue/task-004-dashboard-and-cognition-architecture.md`

### 认知分层收口

- 发布标准：
  - `roadmap / operating-blueprint / task / memory / index` 的边界在文档中清楚
  - 首页摘要只从 Markdown 真相源提取
- 关联任务：
  - `tasks/queue/task-004-dashboard-and-cognition-architecture.md`

### 轻量 Task PM

- 发布标准：
  - task 模板包含 `计划 / 发布说明 / 验收标准 / 复盘`
  - 缺规划时先创建共商 task，而不是直接进入执行
- 关联任务：
  - `tasks/queue/task-004-dashboard-and-cognition-architecture.md`

### Markdown 阅读体验

- 发布标准：
  - 文档页的 `# / ## / ###` 视觉层级清楚
  - 标题不再被重卡片样式覆盖
- 关联任务：
  - `tasks/queue/task-004-dashboard-and-cognition-architecture.md`

## 当前阻塞

- 暂无结构性阻塞；当前主要风险是首页信息结构和文档真相源若不同步，后续会再次返工。

## 下一检查点

- 首页经营驾驶舱 5 模块成型
- `memory/project/operating-blueprint.md` 纳入 scaffold / audit
- task 模板与 `validate-change-trace` 继续通过

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
