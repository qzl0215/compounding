---
title: ROADMAP
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-17
source_of_truth: tasks/queue/task-025-multi-agent-coordination-init.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-025-multi-agent-coordination-init.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 路线图

## 当前阶段

多 Agent 协作系统（Autonomous Multi-Agent Coordination Layer）

## 下个里程碑

初始化 Autonomous Multi-Agent Delivery Framework，使多个 Agent 可在同一仓库中安全并行协作，默认无人值守，仅在高风险决策时生成可读 decision card 供人二选一/三选一。

## 里程碑成功标准

- 落地 agent-coordination 目录骨架与 manifest / lock / task companion / decision 数据模型
- 项目扫描器可生成文件级风险地图（core / high_conflict / normal 等）
- 任务级文件锁可 acquire/release，lock-registry 机器可读
- pre-task check 含 preflight + lock check + task companion 创建
- scope guard 可比较 planned_files vs actual git diff
- auto-review 骨架可输出 scope/lock/test 的 JSON 聚合结果
- decision card 生成器可将高风险决策收敛为 2-3 个可选项
- 所有 coord:* 命令已注册并可用

## 当前优先级

多 Agent 协作系统 Phase 0~3 已落地（t-025/t-026/t-027），当前先用 `t-030` 产出 `gstack -> Compounding` 对齐矩阵，锁定下一阶段只吸收流程、门禁与交付产物层的高 ROI 能力，不引入浏览器 daemon、Bun 原生运行时或 Claude 专属生态。

## 当前执行待办

- [x] 完成 gstack 七项实践里程碑（t-019~t-024）
- [x] 注册新里程碑任务 `t-025`（Multi-Agent Coordination Init）
- [x] 落地 agent-coordination 目录骨架与 coord 命令链（t-025）
- [x] Phase 2 auto-review 增强：contract/architecture reviewer、merge gate、pre-push hook（t-026）
- [x] Phase 3 无人值守完善：UI 产物格式、差异摘要、执行模式降级（t-027）
- [ ] 完成 `t-030`，产出唯一的 `gstack -> Compounding` 对齐矩阵与引入边界
- [ ] 基于 `t-030` 结论决定是否启动 `t-031`、`t-032`、`t-033`

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
