# 任务 task-049-rules-doc-dedup

## 任务摘要

- 短编号：`t-049`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把 AGENTS、AI_OPERATING_MODEL 与 DEV_WORKFLOW 的重复语义收口成单一职责，并清掉活跃职责概念、文档前言分类字段与无挂钩文档噪音。
- 为什么现在：
  这三份文档当前都在解释同一批行为，读起来像三份同义说明书；继续这样写只会增加 token 和维护熵。
- 承接边界：
  只做规则职责去重和句子瘦身，不改 task/companion/release 数据模型，不做兼容层清理，不动页面。
- 完成定义：
  AGENTS 只保留硬规则和门禁，AI_OPERATING_MODEL 只保留 AI 行为原则，DEV_WORKFLOW 只保留 runbook 和命令顺序；三份文档各自职责清楚，重复句显著减少且不丢行为。

## 执行合同

### 要做

- 删掉 AGENTS 中能从 AI_OPERATING_MODEL / DEV_WORKFLOW 直接推导的重复解释句，只保留会改变执行动作的硬规则。
- 收口 AI_OPERATING_MODEL 中重复的工作流语义，保留 AI 行为原则、需求成熟度判断与最小测试治理。
- 收口 DEV_WORKFLOW 中重复的理念句，保留 runbook、命令顺序与进入退出条件。
- 删除 docs/ORG_MODEL.md 的活跃地位，并清掉 WORK_MODES / ARCHITECTURE / AI 重写上下文中的职责依赖与文档前言分类字段。
- 清理无活跃引用但仍在讲旧驾驶舱/旧组织镜头的资料页，例如 docs/UIUX_CURRENT_PACKAGE.md。
- 收掉 README.md 中指向旧职责源的入口。
- 收掉 docs/prompts/ai-doc-rewrite-system.md 中的职责定位段。
- 收掉 bootstrap/project_bootstrap.yaml 和 bootstrap schema 里的职责结构壳。
- 清掉活跃文档 frontmatter 里的静态分类字段，并移除 bootstrap heading alias 中的 `operating_roles` 别名。
- 把当前 plan / task / memory 的波次状态更新到 t-049。
- 在这条分支上继续收口 gstack 低噪音吸收后的最小实现，不额外长出新说明书或新状态源。

### 不做

- 不动 task 模板、companion、release 兼容层。
- 不新建页面、数据库或审批流。
- 不做历史 task 批量迁移。

### 约束

- 只删重复语义，不新增新术语。
- 不改变会影响执行行为的硬规则。
- 能被邻近文档直接说明的句子，优先删除或下沉成链接。

### 关键风险

- 删过头会让行为链断掉，删不够会继续膨胀。
- 如果只是压短文字但没有真正分工，后续还会反弹成新的重复层。

### 测试策略

- 为什么测：规则去重最容易“看起来短了，但行为没变”。
- 测什么：AGENTS 是否只剩硬规则，AI_OPERATING_MODEL 是否保留 AI 行为原则，DEV_WORKFLOW 是否只保留 runbook。
- 不测什么：不做 UI 回归，不改历史 task。
- 当前最小集理由：先验证文档职责单一，再考虑波次三兼容层清理。

## 交付结果

- 状态：doing
- 体验验收结果：
  已完成活跃职责概念删除、文档前言分类字段清理与无挂钩静态噪音清理，待继续验收文档去重是否保持单一职责。
- 交付结果：
  交付范围已扩展并继续推进中，新增 README / prompt / bootstrap 职责壳清理与前言分类字段删除。
- 复盘：
  这轮收口显示：不带执行挂钩的职责概念、无活跃引用的资料页、legacy bootstrap 里的职责结构，以及静态分类字段，都是可优先删除的高 ROI 噪音。
