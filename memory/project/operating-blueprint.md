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
last_reviewed_at: 2026-03-16
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

专业驾驶舱、task/Git 联动与 Markdown 直编收口

## 关键子目标

### 专业经营驾驶舱

- 发布标准：
  - 首页固定为 5 个高浓度模块，且无右侧导航
  - 模块标题与摘要表达更专业，但仍然易读
- 关联任务：
  - `tasks/queue/task-005-professional-dashboard-editing.md`

### Task / Git 联动

- 发布标准：
  - 每个 task 至少具备状态、分支、最近提交
  - `/tasks` 能展示 Git 状态与是否已并入 `main`
- 关联任务：
  - `tasks/queue/task-005-professional-dashboard-editing.md`

### Markdown 直编能力

- 发布标准：
  - 知识库支持 Markdown 阅读 / 编辑双模式
  - 保存后立即回到阅读视图并展示最新内容
- 关联任务：
  - `tasks/queue/task-005-professional-dashboard-editing.md`

### 轻量 Task PM

- 发布标准：
  - task 模板包含 `分支 / 最近提交 / 计划 / 发布说明 / 验收标准 / 复盘`
  - task 是边界，不演化成重型工单
- 关联任务：
  - `tasks/queue/task-005-professional-dashboard-editing.md`

## 当前阻塞

- 暂无结构性阻塞；当前主要风险是 task 状态、Git 运行态与文档真相不同步，后续会再次返工。

## 下一检查点

- 首页专业驾驶舱 5 模块稳定
- `/tasks` 与 `validate-task-git-link` 共同通过
- Markdown 编辑链在本机/内网访问下可用

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
