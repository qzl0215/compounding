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

差异感知 QA / Review / Retro 产物（t-032）

## 关键子目标

### 子目标 1：最小 diff-aware 检查建议

- 发布标准：
  - 常见 diff 能导出足够轻的检查建议，而不是一把上全量门禁
  - 检查选择基于改动范围与风险，不依赖人工拍脑袋
- 关联任务：
  - `tasks/queue/task-032-diff-aware-qa-review-retro.md`

### 子目标 2：统一 review / retro 结构化输出

- 发布标准：
  - review 摘要、retro 摘要和 ship log 结构统一
  - 产物可复用，但不新增平行评估体系
- 关联任务：
  - `tasks/queue/task-032-diff-aware-qa-review-retro.md`

### 子目标 3：沉淀可比较经验资产

- 发布标准：
  - 高价值 review / retro 结果能沉淀到 `memory/experience/*` 或相关摘要页
  - 相似改动可被快速横向比较
- 关联任务：
  - `tasks/queue/task-032-diff-aware-qa-review-retro.md`

### 子目标 4：保持门禁轻量

- 发布标准：
  - 不引入外部评估平台
  - 不把所有改动升级成重回归
- 关联任务：
  - `tasks/queue/task-032-diff-aware-qa-review-retro.md`

## 当前阻塞

- 无结构性阻塞；核心风险在于如果 runbook 写得过重，会再次制造规则负担。

## 下一检查点

- [x] 完成 `t-031` 的工作模式入口与 runbook 收口
- [ ] 推进 `t-032` 的差异感知 QA / Review / Retro 产物
- [ ] 再确认 `t-033` 的进入顺序与边界
- [ ] 用这份 runbook 与用户确认下一轮只吸收流程、门禁和交付产物层能力

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
