---
title: ROADMAP
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-20
source_of_truth: memory/project/roadmap.md
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

先创建下一阶段规划 task，明确 Autonomous Multi-Agent Delivery Framework 的首个实现边界、冻结项与成功标准；在规划完成前，不直接开启新的实现任务，也不引入浏览器 daemon、Bun 原生运行时或 Claude 专属生态。

## 当前执行待办

- [x] 完成 gstack 七项实践里程碑（t-019~t-024）
- [x] 注册新里程碑任务 `t-025`（Multi-Agent Coordination Init）
- [x] 落地 agent-coordination 目录骨架与 coord 命令链（t-025）
- [x] Phase 2 auto-review 增强：contract/architecture reviewer、merge gate、pre-push hook（t-026）
- [x] Phase 3 无人值守完善：UI 产物格式、差异摘要、执行模式降级（t-027）
- [x] 完成 `t-030`，产出唯一的 `gstack -> Compounding` 对齐矩阵与引入边界
- [x] 推进 `t-031`：收口工作模式入口与 runbook
- [x] 推进 `t-032`：差异感知 QA / Review / Retro 产物
- [x] 完成 `t-033`：补齐 pre-task 安全护栏
- [x] 完成 `t-034`：统一 task resolver、修复 release cutover 时序、继续收口交付快照与任务表展示
- [ ] 创建下一阶段规划 task，明确 Delivery Framework 的首个实现边界

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
