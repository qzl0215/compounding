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

## 实施结果

### 已完成
- ✅ 创建 pre-landing-checklist.js 脚本，包含 5 项核心检查
- ✅ 定义 AUTO-FIX / ASK 分流规则，支持自动修复与手动处理
- ✅ 集成现有验证命令（git status, pnpm validate:*）
- ✅ 实现检查结果汇总与下一步动作指导
- ✅ 支持工作区干净、任务绑定、变更追踪、静态/构建检查

### 验证结果
- 脚本能够正确识别当前任务和模式
- AUTO-FIX 逻辑成功修复 lint 问题（pnpm lint --fix）
- 失败时能提供明确的下一步动作建议
- 按 AUTO-FIX vs ASK 分流决策清晰可执行

## 发布说明

本任务交付 pre-landing checklist 与分流契约，为后续落地提供标准化检查框架。

## 验收标准

- ✅ checklist 条目短小可执行，且每条都有证据要求
- ✅ 失败能给出明确下一步动作，并按 AUTO-FIX / ASK 分流
- ✅ 至少 1 次真实落地过程能按 checklist 完整走通

## 风险

- checklist 形同虚设：写了但没人用 → 已集成到标准流程，提供清晰收益
- 分流规则缺乏收敛：同类问题来回被归类 → 已定义明确边界条件

## 状态

done

## 更新痕迹

- 记忆：`memory/project/operating-blueprint.md`
- 索引：`scripts/ai/pre-landing-checklist.js`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-024-pre-landing-checklist-and-routing.md`

## 一句复盘

通过 pre-landing checklist 将"该不该落地"从主观判断转为证据化决策，显著减少遗漏与无效往返，AUTO-FIX/ASK 分流机制确保问题处理路径清晰可执行。
