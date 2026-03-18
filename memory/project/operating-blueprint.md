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
  - tasks/queue/task-019-gstack-practices-milestone.md
last_reviewed_at: 2026-03-17
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

gstack 高价值实践七项落地里程碑

## 关键子目标

### 子目标 1：模式化协作骨架（Plan / Execute / QA-Review）

- 发布标准：
  - 3 个模式的输入、输出、退出条件在主源中明确且可执行
  - 模式切换不依赖口头约定，默认由 task 状态驱动
- 关联任务：
  - `tasks/queue/task-019-gstack-practices-milestone.md`
  - `tasks/queue/task-020-collaboration-modes-and-preamble.md`

### 子目标 2：统一 preamble 与提问契约

- 发布标准：
  - 高频执行链路在进入动作前执行统一 preamble
  - 上下文重置、任务绑定、提问格式、证据边界在 preamble 中固定
- 关联任务：
  - `tasks/queue/task-019-gstack-practices-milestone.md`
  - `tasks/queue/task-020-collaboration-modes-and-preamble.md`

### 子目标 3：分层验证与 diff-aware QA

- 发布标准：
  - 静态 / 构建 / 运行时 / AI 输出门禁在同一执行面收口
  - QA 默认以改动范围优先，提供健康评分与证据落点
- 关联任务：
  - `tasks/queue/task-019-gstack-practices-milestone.md`
  - `tasks/queue/task-021-fix-first-and-layered-gates.md`
  - `tasks/queue/task-023-diff-aware-qa-and-health-score.md`

### 子目标 4：Fix-First 分流与自动修复优先

- 发布标准：
  - review / ship 场景区分 AUTO-FIX 与 ASK，并有明确分流边界
  - 对可机械修复项优先自动收敛，减少反复对话
- 关联任务：
  - `tasks/queue/task-019-gstack-practices-milestone.md`
  - `tasks/queue/task-021-fix-first-and-layered-gates.md`
  - `tasks/queue/task-024-pre-landing-checklist-and-routing.md`

### 子目标 5：模板生成防漂移与反馈闭环

- 发布标准：
  - 至少 1 类关键资产改为“模板 + 生成 + 校验”链路
  - 工具体验问题可沉淀为结构化反馈并回写经验层
- 关联任务：
  - `tasks/queue/task-019-gstack-practices-milestone.md`
  - `tasks/queue/task-022-template-generation-and-feedback-loop.md`

## 当前阻塞

- 当前无结构性阻塞；核心风险在于一次性改造过大导致节奏失控，需按批次滚动验收。

## 下一检查点

- [x] 完成 `t-019` 拆解并建立首批执行任务
- [x] 首批实现至少覆盖 3 个高 ROI 实践点并通过门禁
- [x] 验证任务、规则、记忆资产在一次迭代内保持同源一致
- [ ] 开启下一阶段里程碑并持续迭代 AI-Native OS## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
