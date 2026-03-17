# 任务 task-024-pre-landing-checklist-and-routing

## 短编号

t-024

## 目标

落地 pre-landing checklist，并把 Review/Ship 的决策显式分流为 AUTO-FIX vs ASK，形成“落地前必走的最小检查清单”。

## 为什么

当前落地质量很大程度依赖个人记忆与临场判断；缺少一个统一的落地前清单，会导致遗漏、反复沟通和不一致的验收口径。

## 范围

- 定义 pre-landing checklist 的条目、顺序与证据要求
- 将 checklist 与现有门禁命令映射，并输出统一可读的通过/失败语义
- 定义 AUTO-FIX 与 ASK 的边界，并在 checklist 失败时给出默认下一步动作

## 范围外

- 不引入新的发布管道或复杂 CI
- 不把所有检查都升级为硬阻断项

## 约束

- checklist 必须短小可执行，默认覆盖最高频失败点
- 失败必须给出下一步动作，不只给错误

## 关联模块

- `scripts/pre_mutation_check.py`
- `package.json`（validate:* 命令）
- `apps/studio/src/modules/releases/validation.ts`
- `tasks/queue/task-024-pre-landing-checklist-and-routing.md`

## 当前模式

方案评审

## 分支

`codex/task-024-pre-landing-checklist-and-routing`

## 最近提交

`auto: branch HEAD`

## 交付收益

减少落地前遗漏与无效往返，把“该不该落地”转为可证据化决策，提升发布稳定性。

## 交付风险

若 checklist 过长会被跳过；若 AUTO-FIX 边界过宽可能误修，过窄收益不足。

## 计划

1. 盘点现有门禁与常见失败点，确定最小 checklist。
2. 定义 AUTO-FIX / ASK 分流规则，给出默认动作模板。
3. 在至少一条真实任务链路中试跑并收敛条目。

## 发布说明

本任务先交付 checklist 与分流契约；具体自动修复能力按收益逐步补齐。

## 验收标准

- checklist 条目短小可执行，且每条都有证据要求
- 失败能给出明确下一步动作，并按 AUTO-FIX / ASK 分流
- 至少 1 次真实落地过程能按 checklist 完整走通

## 风险

- checklist 形同虚设：写了但没人用
- 分流规则缺乏收敛：同类问题来回被归类

## 状态

doing

## 更新痕迹

- 记忆：`memory/project/operating-blueprint.md`
- 索引：`no change: 本轮仅新增任务编排`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-024-pre-landing-checklist-and-routing.md`

## 一句复盘

未复盘
