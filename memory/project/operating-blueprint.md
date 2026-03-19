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
last_reviewed_at: 2026-03-19
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

高 ROI 收敛修复

## 关键子目标

### 子目标 1：统一 task 身份解析

- 发布标准：
  - `t-xxx`、`task-xxx-...` 与 `tasks/queue/*.md` 都能解析到同一 task
  - release 脚本、task 校验器与页面层不再存在双身份口径
- 关联任务：
  - `tasks/queue/task-034-high-roi-convergence-fixes.md`

### 子目标 2：补齐 production cutover 闭环

- 发布标准：
  - `switch-release` 结束后天然满足 `runtime_release_id = current_release_id`
  - 不再依赖额外手动 `restart-prod` 才消除 drift
- 关联任务：
  - `tasks/queue/task-034-high-roi-convergence-fixes.md`

### 子目标 3：收口战略真相 frontmatter

- 发布标准：
  - `roadmap.md` 的 frontmatter 与真相源地图一致
  - scaffold/catalog 不再把旧的 source_of_truth 重新写回 live 文档
- 关联任务：
  - `tasks/queue/task-034-high-roi-convergence-fixes.md`

### 子目标 4：继续瘦身交付快照与任务表

- 发布标准：
  - `DeliverySnapshot` 不再同时暴露原始 task 列表和页面投影
  - `/tasks` 主表不再平铺内部路径，但展开详情仍保留工程排障信息
- 关联任务：
  - `tasks/queue/task-034-high-roi-convergence-fixes.md`

## 当前阻塞

- 无结构性阻塞；当前风险是若只收一半，会继续保留 task / release / 页面三处口径不一致。

## 下一检查点

- [x] 完成 `t-031` 的工作模式入口与 runbook 收口
- [x] 完成 `t-032` 的差异感知 QA / Review / Retro 产物
- [x] 完成 `t-033` 的预任务安全护栏补全
- [ ] 完成 `t-034` 的高 ROI 收敛修复
- [ ] 创建下一阶段规划 task，明确首个 Delivery Framework 执行边界

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
