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
  - docs/DEV_WORKFLOW.md
last_reviewed_at: 2026-03-22
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

需求环节总图与启发式对话入口

## 关键子目标

### 子目标 1：保持当前真相源与发布链稳定

- 发布标准：
  - `task / release / companion / 首页决策板` 的显式绑定继续保持稳定
  - 不因下一阶段切换重新引入双真相、假状态或启发式绑定

### 子目标 2：定义下一阶段唯一主线

- 发布标准：
  - 首页、任务页、知识库、发布页共用同一套需求环节模型
  - `roadmap / current-state / operating-blueprint` 三者口径一致

### 子目标 3：延续高 ROI 收口原则

- 发布标准：
  - 只把真正影响需求判断和执行节奏的状态放进首屏
  - 不把首页、任务页或发布页重新做回重型工作台

## 待思考

- 用户随手想到但没想清楚的内容，怎样稳定留在主源里而不被误判为待执行
- AI 的启发式对话如何显式产品化，避免一进入新线程就直接做实现
- 首页怎样用人话表达需求环节，而不是重新长出抽象术语墙

## 待规划

- 规划类 task 与执行类 task 的长期判定边界，还需要在更多真实任务里继续验证
- 需求环节模型是否需要更多自动提醒，只能在不增加 ceremony 的前提下推进
- 知识库证据入口的精选范围需要继续收敛，避免重新变回第二套目录系统

## 下一步对话

- 先问：这件事到底是问题、方向，还是已经明确的执行项
- 再问：为什么现在要做，不做会怎样
- 再问：成功算什么，范围外是什么
- 边界没说清前，不进入执行 task
- 已进入待验收时，先完成验收，不继续堆新改动

## 当前阻塞

- 当前主要风险不再是 Phase 2 未完成，而是“待思考 / 待规划 / 待执行”若继续混写，AI 和人都会重新回到边聊边猜、过早开工的状态。

## 下一检查点

- [x] 完成 `t-038` 的短编号唯一性、规则层瘦身与 cockpit 收口
- [x] 保持任务页、发布页与知识库继续承接详情，不把首页重新做重
- [x] 在 preview / prod 两条链上确认结构收口没有破坏现有发布闭环
- [x] 确认下一阶段主线任务与其成功标准
- [ ] 推进 `t-040` 的 stage-first 页面、主源分区与对话提示
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
