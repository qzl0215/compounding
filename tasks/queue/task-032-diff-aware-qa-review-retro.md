# 差异感知 QA / Review / Retro 产物

## 短编号

t-032

## 目标

基于改动范围和风险输出更稳定的 QA / Review / Retro 产物，让验证和复盘更贴近真实 diff，而不是继续依赖人工挑检查项。

## 为什么

当前仓库已经有门禁和发布链，但检查选择、review 产物和 retro 结果仍偏人工组织。若不把 diff-aware 思路引入交付链，后续高频改动仍会反复判断“这轮该跑哪些检查、该写什么产物”。

## 范围

- 根据 diff 和风险生成建议检查列表
- 统一 review 摘要、retro 摘要等交付产物结构
- 把高价值结果沉淀到 `memory/experience/*` 或相关摘要页

## 范围外

- 不引入外部评估平台
- 不上 LLM judge 矩阵
- 不把所有改动升级成重回归

## 约束

- 优先复用现有门禁链和 task / release 模型
- 产物必须足够轻，不能反向制造表单负担

## 关联模块

- `scripts/ai/*`
- `memory/experience/*`
- `apps/studio/src/modules/releases/*`

## 当前模式

方案评审

## 分支

`codex/task-032-diff-aware-qa-review-retro`

## 最近提交

`auto: branch HEAD`

## 交付收益

让同类改动更稳定地得到相近检查和产物，降低 review 与 retro 的组织成本。

## 交付风险

如果 diff-aware 规则过粗，会输出低价值建议；如果产物太多，会让门禁链变重。

## 一句复盘

未复盘

## 主发布版本

未生成

## 关联发布版本

无

## 计划

1. 为常见 diff 类型生成最小检查建议。
2. 统一 review / retro 的结构化输出。
3. 让产物可复用，但不新增平行评估体系。

## 发布说明

本任务是 `t-030` 之后的候选实现任务，当前仅入列，不进入执行。

## 验收标准

- 同类 diff 能稳定得到相近检查建议
- review / retro 产物结构统一且足够轻
- 不引入外部平台或重型评估体系

## 风险

- 规则太松，产物缺乏指导价值
- 规则太硬，导致低价值检查升级成流程负担

## 状态

todo

## 更新痕迹

- 记忆：`no change: planning candidate only`
- 索引：`no change: planning candidate only`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-032-diff-aware-qa-review-retro.md`

## 复盘
