---
title: EXP_004_GSTACK_ALIGNMENT_BOUNDARY
doc_role: memory
update_mode: append_only
status: active
source_of_truth: memory/experience/README.md
related_docs:
  - memory/project/roadmap.md
  - docs/AI_OPERATING_MODEL.md
  - tasks/queue/task-030-gstack-alignment-and-adoption-boundary.md
last_reviewed_at: 2026-03-19
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# gstack 对齐矩阵与引入边界

## 背景

当前仓库已经吸收了 `gstack` 的部分高价值思路，例如工作模式产品化、分层验证、经验资产化与任务前安全链。但这批吸收是分阶段落地的，还缺一份统一矩阵来回答：哪些值得继续引入，哪些需要改造后引入，哪些应明确排除。

## 对齐矩阵

| 类别 | `gstack` 内容 | 它解决什么问题 | 当前是否已有同类能力 | 最小落点 | 结论 |
| --- | --- | --- | --- | --- | --- |
| 直接吸收 | 显式工作模式 | 减少“一个模糊助理包打天下” | 已有 5 个工作模式，但入口仍偏文档化 | `docs/WORK_MODES.md`、`docs/DEV_WORKFLOW.md`、`scripts/ai/*` | 继续吸收 |
| 直接吸收 | 分层验证 | 让问题定位更快、校验成本更清楚 | 已有静态 / 构建 / 运行时 / AI 输出四层门禁 | `docs/DEV_WORKFLOW.md`、`scripts/ai/*` | 继续吸收 |
| 直接吸收 | 历史沉淀可比较 | 避免 memory 只记录、不支撑后续判断 | 已有 experience-index 和 ADR | `memory/experience/*` | 继续吸收 |
| 改造后吸收 | diff-aware QA / review / retro | 让检查和 review 更贴近改动范围 | 现有门禁链已稳定，但 diff-aware 产物还弱 | `scripts/ai/*`、`memory/experience/*`、`/releases` 摘要 | 改造后吸收 |
| 改造后吸收 | 预任务安全链 | 在动手前暴露范围越界和高风险决策 | 已有 coordination / pre-task check 基础 | `agent-coordination/*`、`scripts/ai/*` | 改造后吸收 |
| 改造后吸收 | work modes 的产品化入口 | 把模式从文档提升为更明确入口 | 旧职责说明与模式已拆开，但高频入口仍弱 | `docs/WORK_MODES.md`、`scripts/ai/*` | 改造后吸收 |
| 明确不吸收 | Bun 浏览器 daemon | 强化浏览器自动化和长会话基础设施 | 当前项目并不以浏览器运行时为核心 | 无 | 不吸收 |
| 明确不吸收 | Claude 专属 slash-skill 生态 | 深度绑定单一客户端和命令面板 | 当前项目强调模型/客户端无关 | 无 | 不吸收 |
| 明确不吸收 | 重型本地浏览器运行时 | 为客户端会话而重做基础设施 | 当前发布与运行态模型已够用 | 无 | 不吸收 |

## 分段学习计划

### 第一段：对齐矩阵

- 盘读 `README / ARCHITECTURE / BROWSER / CLAUDE / TODOS / package scripts`
- 产出本矩阵，明确吸收边界
- 对应任务：`t-030`

### 第二段：模式与入口

- 继续把 `战略澄清 / 方案评审 / 工程执行 / 质量验收 / 发布复盘` 产品化成更清晰入口与 runbook
- 对应任务：`t-031`

### 第三段：差异感知验证与交付产物

- 引入 diff-aware QA / review / retro 思路
- 让 review 结论和 retro 更贴近真实改动范围
- 对应任务：`t-032`

### 第四段：预任务安全与协作护栏

- 补齐 pre-task gate、scope guard 与高风险决策收口
- 对应任务：`t-033`

## 决策

当前阶段只优先吸收 `gstack` 的流程、门禁和交付产物思路，不引入它的浏览器基础设施与 Claude 专属生态。

## 为什么

本项目的初心是“AI-Native Repo + 任务驱动 + 可持续重构 + 可验证发布”，与 `gstack` 一致的部分在执行质量和门禁质量，而不在浏览器基础设施。若照搬其客户端绑定和运行时，会显著增加复杂度，也偏离当前项目“轻主源、强门禁、少平行体系”的方向。

## 影响

- 后续实现任务只沿 `t-031`、`t-032`、`t-033` 三条主线推进
- 浏览器 daemon / Bun / Claude 专属能力默认排除，不再反复讨论
- 主线从“继续零散吸收”转为“先定边界，再逐项引入”

## 复用

- 以后再研究外部 AI 开发框架时，先做对齐矩阵，再决定吸收，不再直接把对方实现形态搬进本仓库
- 若某项能力无法明确回答“解决什么问题 / 当前是否已有 / 最小落点在哪”，就不应进入执行任务
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
