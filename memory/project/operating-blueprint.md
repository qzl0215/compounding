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

下一阶段规划

## 关键子目标

### 子目标 1：定义 Delivery Framework 的首个实现边界

- 发布标准：
  - 明确首个实现任务的目标、范围外、成功标准与冻结项
  - 不在规划未完成前直接开启新的实现任务
- 关联任务：
  - 待创建下一阶段规划 task

### 子目标 2：固定下一阶段的安全边界

- 发布标准：
  - 明确哪些能力继续吸收、哪些明确不做
  - 继续沿用 `main` / `dev` / task / release 的现有交付边界
- 关联任务：
  - 待创建下一阶段规划 task

### 子目标 3：给后续实现任务准备清晰入口

- 发布标准：
  - roadmap、current-state 与 operating-blueprint 对下一阶段口径一致
  - 后续第一个实现 task 可以直接按规划边界开工
- 关联任务：
  - 待创建下一阶段规划 task

## 当前阻塞

- 无结构性阻塞；当前风险是若跳过规划直接进入实现，会再次制造 roadmap、task 与交付边界漂移。

## 下一检查点

- [x] 完成 `t-031` 的工作模式入口与 runbook 收口
- [x] 完成 `t-032` 的差异感知 QA / Review / Retro 产物
- [x] 完成 `t-033` 的预任务安全护栏补全
- [x] 完成 `t-034` 的高 ROI 收敛修复
- [ ] 创建下一阶段规划 task，明确首个 Delivery Framework 执行边界

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
