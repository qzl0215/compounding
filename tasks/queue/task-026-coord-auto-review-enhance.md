# 任务 task-026-coord-auto-review-enhance

## 短编号

t-026

## 目标

完善 Multi-Agent Coordination Layer 的 auto-review 体系：contract reviewer、architecture reviewer、merge gate 综合输出，低风险任务完整自动流转，接入 git hooks / CI。

## 为什么

Phase 1 已落地 scope/lock/test reviewer 骨架，但缺少 contract、architecture、merge gate 综合决策能力；低风险任务尚不能完整自动流转。

## 范围

- 完善 contract reviewer（接口/类型/路由/schema 契约检查）
- 完善 architecture reviewer（改动面、结构习惯、简化建议）
- merge gate 综合输出 auto_merge | block_and_retry | escalate_to_human
- 低风险任务完整自动流转
- 接入 git hooks 或 CI

## 范围外

- 不实现 UI 验收产物生成（Phase 3）
- 不实现差异摘要生成器（Phase 3）

## 约束

- 继续以 agent-coordination 为扩展层，不覆盖现有 scripts/ai
- 规则系统化，关键逻辑机器可读可执行

## 关联模块

- `agent-coordination/`
- `scripts/coord/review.ts`
- `scripts/ai/validate-*`

## 当前模式

方案评审

## 分支

`待分配`

## 最近提交

`auto: branch HEAD`

## 交付收益

多 Agent 协作时，低风险任务可自动流转，merge gate 可给出明确决策，减少人工介入。

## 交付风险

merge gate 过于保守会阻塞合理合并；过于激进会放行有风险改动。

## 计划

1. 设计 contract reviewer 与 architecture reviewer 的输入输出
2. 实现 reviewer 并接入 review.ts
3. 实现 merge gate 综合逻辑
4. 接入 pre-push 或 CI

## 验收标准

- merge gate 可输出 auto_merge | block_and_retry | escalate_to_human
- 低风险任务在通过 reviewer 后可自动进入合并队列
- coord:review:run 输出包含 merge_decision 与 merge_confidence_score

## 风险

- reviewer 过多会增加执行耗时
- CI 接入需与现有 main-release-guard 协调

## 状态

todo

## 更新痕迹

- 记忆：`no change: task created only`
- 索引：`no change: task created only`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-026-coord-auto-review-enhance.md`

## 一句复盘

（待完成）
