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
  - tasks/queue/task-025-multi-agent-coordination-init.md
last_reviewed_at: 2026-03-20
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

Delivery Framework Phase 1 已完成，下一阶段待定，当前聚焦 `t-037` 首页决策板收口与首屏信息压缩

## 关键子目标

### 子目标 1：固定首页决策板的最小信息面

- 发布标准：
  - 首页首屏只保留当前阶段、运行与发布、当前阻塞与下一步
  - 不再在首页平铺任务细节、证据列表或长篇项目说明
- 关联任务：
  - `tasks/queue/task-037-homepage-decision-board.md`

### 子目标 2：继续复用现有 ProjectCockpit 派生事实

- 发布标准：
  - 继续只从 current-state、roadmap、operating-blueprint、DeliverySnapshot 和 release runtime 取值
  - 不新增首页专用状态源
- 关联任务：
  - `tasks/queue/task-037-homepage-decision-board.md`

### 子目标 3：维持任务页、发布页与知识库的详情承载职责

- 发布标准：
  - 任务页继续承接任务摘要、交付风险、复盘和详情
  - 发布页继续承接 release 台账、运行态和回滚 / 验收入口
  - 知识库继续承接文档原文与主源沉淀
- 关联任务：
  - `tasks/queue/task-037-homepage-decision-board.md`

## 当前阻塞

- 当前主要风险不是底座缺失，而是首页若仍承载过多解释内容，会重新变回详情工作台，破坏“先判断、再下钻”的结构。

## 下一检查点

- [x] 完成 `t-031` 的工作模式入口与 runbook 收口
- [x] 完成 `t-032` 的差异感知 QA / Review / Retro 产物
- [x] 完成 `t-033` 的预任务安全护栏补全
- [x] 完成 `t-034` 的高 ROI 收敛修复
- [x] 完成 `t-035` 的边界规划与主线切换
- [x] 完成 `t-036` 的 companion contract 实现
- [ ] 推进 `t-037`：将首页收口为决策板

## 证据边界

- 本地离线证据：`t-035` 规划文档、`t-036` 任务定义、`memory/experience/exp-006-delivery-framework-phase-one-boundary.md`
- 服务器真实证据：本地生产 active release 与 `/releases` 页面应显示 `t-035` 已完成
- 当前结论适用边界：当前里程碑已从“边界定义”和“Phase 1 实现”切到收口完成；当前处于下一阶段候选评估期，尚未确认新的实现主线
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
