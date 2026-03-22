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

Phase 2 收口完成，下一阶段主线待定

## 关键子目标

### 子目标 1：保持当前真相源与发布链稳定

- 发布标准：
  - `task / release / companion / 首页决策板` 的显式绑定继续保持稳定
  - 不因下一阶段切换重新引入双真相、假状态或启发式绑定

### 子目标 2：定义下一阶段唯一主线

- 发布标准：
  - 下一阶段的目标、范围外、成功标准与第一条执行 task 被明确写入主线文档
  - `roadmap / current-state / operating-blueprint` 三者口径一致

### 子目标 3：延续高 ROI 收口原则

- 发布标准：
  - 若继续治理结构，只选择真正影响 AI 自主能力和发布稳定性的高 ROI 点
  - 不把首页、任务页或发布页重新做重

## 当前阻塞

- 当前主要风险不再是 Phase 2 未完成，而是下一阶段目标若定义过散，可能重新把系统拉回“边做边猜”的状态。

## 下一检查点

- [x] 完成 `t-038` 的短编号唯一性、规则层瘦身与 cockpit 收口
- [x] 保持任务页、发布页与知识库继续承接详情，不把首页重新做重
- [x] 在 preview / prod 两条链上确认结构收口没有破坏现有发布闭环
- [ ] 确认下一阶段主线任务与其成功标准
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
