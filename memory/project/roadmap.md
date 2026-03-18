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

围绕 Phase 0+1 建立“manifest 扫描 -> lock registry -> pre-task check -> scope guard -> review 骨架 -> decision card”最小闭环，先跑通 coord 命令链，再进入 Phase 2 自动化增强。

## 当前执行待办

- [x] 完成 gstack 七项实践里程碑（t-019~t-024）
- [x] 注册新里程碑任务 `t-025`（Multi-Agent Coordination Init）
- [ ] 落地 agent-coordination 目录骨架与 JSON schema
- [ ] 实现 scan.ts / lock.ts / check.ts / scope-guard.ts / review.ts / decision.ts
- [ ] 在 package.json 注册 coord:* 命令
- [ ] 注册 t-026（Phase 2）、t-027（Phase 3）子任务骨架

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
