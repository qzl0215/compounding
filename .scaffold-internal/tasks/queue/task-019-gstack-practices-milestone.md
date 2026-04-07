# 任务 task-019-gstack-practices-milestone

## 短编号

t-019

## 目标

把 gstack 最值得吸收的 7 个高价值实践落地为本项目下一里程碑，并建立“持续拆解推进直至达成”的执行机制。

## 为什么

当前仓库已具备任务驱动与门禁基础，但缺少一套稳定、可复用、可持续迭代的 AI 协作执行操作系统。若不把高价值实践结构化落地，主线效率和质量会继续依赖个体经验，难以规模化复制。

## 范围

- 把 7 个实践正式写入 roadmap / operating-blueprint / current-state / AGENTS 当前主线
- 把 7 个实践拆解为可独立验收的子目标与批次推进清单
- 建立首批高 ROI 实施顺序与门禁约束
- 形成“完成度 / 风险 / 下一动作”持续更新机制
- 绑定后续实现任务并持续回写 task、memory、docs、code_index

## 范围外

- 不在本任务内一次性完成全部代码实现
- 不引入新的平行状态源、数据库或后台任务系统
- 不绕过现有 task / release / 门禁机制

## 约束

- 继续坚持 `AGENTS.md` 为唯一高频主源
- 每轮改动必须绑定 task，并通过既有门禁链路
- 执行顺序默认“高 ROI 优先，小步快跑，批次验收”
- 任一子任务完成后都要回写记忆与状态，防止主线漂移

## 关联模块

- `AGENTS.md`
- `memory/project/roadmap.md`
- `memory/project/operating-blueprint.md`
- `memory/project/current-state.md`
- `tasks/queue/task-019-gstack-practices-milestone.md`
- `tasks/queue/task-020-collaboration-modes-and-preamble.md`
- `tasks/queue/task-021-fix-first-and-layered-gates.md`
- `tasks/queue/task-022-template-generation-and-feedback-loop.md`
- `tasks/queue/task-023-diff-aware-qa-and-health-score.md`
- `tasks/queue/task-024-pre-landing-checklist-and-routing.md`

## 当前模式

发布复盘

## 分支

`codex/task-019-gstack-practices-milestone`

## 最近提交

`auto: branch HEAD`

## 交付收益

把高价值 AI 协作实践沉淀为可持续执行系统，降低沟通损耗、减少重复判断、提高交付稳定性与可追踪性。

## 交付风险

若拆解粒度过大，会造成计划正确但落地迟缓；若批次边界不清，会出现“同时推进太多点导致全部半完成”。

## 计划

1. 把 7 个实践写成里程碑级主线，并统一主源文档叙事。
2. 建立实施批次：
   - Batch A：模式化协作骨架、Fix-First 分流、模板生成防漂移
   - Batch B：统一 preamble、分层验证总入口、diff-aware QA
   - Batch C：工具体验反馈闭环与经验晋升机制
   - 当前已创建批次任务：`t-020`、`t-021`、`t-022`、`t-023`、`t-024`
3. 每个批次按“方案评审 -> 工程执行 -> 质量验收 -> 发布复盘”闭环推进。
4. 每轮验收后更新完成度看板，直至 7/7 全部达标。

## 发布说明

本任务为里程碑级规划与编排任务；后续实现将通过子任务分批交付并分别验收。

## 验收标准

- 7 个实践全部映射到明确子目标与执行批次
- 主源文档对当前里程碑描述一致
- 至少定义首批可执行实现任务清单与验收门禁
- 后续推进可按 task 状态持续跟踪，直到 7/7 达成

## 风险

- 批次切分不合理，导致前置依赖反复重排
- 过度追求完整设计，推迟必要的小步落地
- 规则描述更新快于实现进度，导致“文档超前”错觉

## 状态

done

## Release ID

20260318064632-565e8de-prod

## 更新痕迹

- 记忆：`memory/project/roadmap.md`, `memory/project/operating-blueprint.md`, `memory/project/current-state.md`
- 索引：`no change: 本轮仅里程碑与任务编排`
- 路线图：`memory/project/roadmap.md`
- 文档：`AGENTS.md`, `tasks/queue/task-019-gstack-practices-milestone.md`

## 一句复盘

通过建立 Batch A/B/C 批次执行机制，将 gstack 高价值实践结构化落地为本项目的核心操作系统，确保了里程碑的可追踪性与交付质量。

把“知道该做什么”升级为“能持续做完并可验证地做对”。
