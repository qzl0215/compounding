---
title: ROADMAP
doc_role: planning
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-17
source_of_truth: tasks/queue/task-019-gstack-practices-milestone.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-019-gstack-practices-milestone.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 路线图

## 当前阶段

gstack 高价值实践七项落地里程碑

## 下个里程碑

把 gstack 中最值得吸收的 7 个实践（模式化协作、统一 preamble、分层验证、diff-aware QA、Fix-First 分流、模板生成防漂移、工具体验反馈闭环）落地到本仓库，并形成可持续拆解推进机制直至全部达成。

## 里程碑成功标准

- 建立并固化 3 个高频协作模式（Plan / Execute / QA-Review），每个模式都有固定输入、输出和退出条件
- 所有高频模式接入统一 preamble（上下文重置、任务绑定、提问契约、会话约束）
- 验证链路显式分层为静态 / 构建 / 运行时 / AI 输出，并落地到统一执行入口
- QA 默认支持 diff-aware 策略，能够依据改动范围生成可追踪测试结论与健康摘要
- Review/Ship 流程落地 Fix-First（AUTO-FIX vs ASK）分流，减少无效往返
- 至少 1 类关键文档资产切换为模板生成并建立一致性校验，避免文档与实现漂移
- 建立工具体验反馈闭环，将可复用改进沉淀到 `memory/experience/*` 并可晋升

## 当前优先级

围绕 7 个高价值实践建立“里程碑 -> 子目标 -> task 批次 -> 验收门禁”推进链路，先完成规则与任务编排，再按批次持续实现。

## 当前执行待办

- [x] 创建并启动 `t-019`，把 7 个实践拆为可独立验收的任务批次
- [x] 建立首批子任务 `t-020`、`t-021`、`t-022` 对应高 ROI 三项基础能力
- [x] 补齐子任务 `t-023`（diff-aware QA 与健康评分）、`t-024`（pre-landing checklist 与分流）
- [x] 把分层验证与 diff-aware QA 绑定到现有门禁命令，输出统一可读结论
- [x] 建立工具体验反馈闭环，并规定何时写入 `memory/experience/*` 与何时晋升
- [ ] 启动下一阶段里程碑：AI-Native 协作深度演进

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
