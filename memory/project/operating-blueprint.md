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
  - tasks/queue/task-018-home-unified-cockpit.md
last_reviewed_at: 2026-03-17
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

首页统一驾驶舱一期

## 关键子目标

### 首页信息架构收口

- 发布标准：
  - 首页固定收口为 5 个区块，而不是继续并列堆更多模块
  - 首页优先回答“项目是什么、现在最重要的事、现在卡在哪、下一步去哪看”
  - 首页不是营销页，也不是文件树入口，而是统一驾驶舱
- 关联任务：
  - `tasks/queue/task-018-home-unified-cockpit.md`

### 统一快照与证据落点

- 发布标准：
  - `portal` 提供统一驾驶舱快照接口，从现有 Markdown 与 release runtime 抽取事实
  - 首页所有摘要都带证据落点，能下钻到 task、memory、docs 或 `/releases`
  - 首页只做人类友好的投影，不新建后台状态表或平行真相源
- 关联任务：
  - `tasks/queue/task-018-home-unified-cockpit.md`

### 详情工作台边界稳定

- 发布标准：
  - `/tasks`、`/knowledge-base`、`/releases` 继续承接详情阅读与现有操作
  - 首页只做浏览与导航，不新增聊天面板或执行按钮
  - 详情页文案与命名统一到“驾驶舱下钻页”语境，不重做核心能力
- 关联任务：
  - `tasks/queue/task-018-home-unified-cockpit.md`

## 当前阻塞

- 当前无结构性阻塞；关键在于先对齐主源，再升级首页，否则驾驶舱会把现有文档冲突直接放大给用户。

## 下一检查点

- 对齐 `AGENTS / roadmap / operating-blueprint / current-state` 的当前主线
- 完成统一驾驶舱快照接口与首页 5 区块重构
- 验证首页能把任务与运行态翻译成产品/运营可读的话术

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
