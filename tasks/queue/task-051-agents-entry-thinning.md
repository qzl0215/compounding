# 任务 task-051-agents-entry-thinning

## 任务摘要

- 短编号：`t-051`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  AGENTS 执行入口激进瘦身
- 为什么现在：
  当前 AGENTS 仍混有 runbook、专项治理和运行事实，虽然比之前薄，但还不是一屏内的执行入口，会持续放大默认阅读负担。
- 承接边界：
  继续激进瘦身 AGENTS，只保留会直接改变执行动作的原则、读链和门禁；把 runbook、AI 行为、专项治理和运行事实落到对应主源；不改路径、不加新文档。
- 完成定义：
  AGENTS 只剩执行原则、默认读链和最小门禁；迁出的内容在 DEV_WORKFLOW、AI_OPERATING_MODEL、PROJECT_RULES、current-state 中各归其位；知识库与默认读链仍正常工作。

## 执行合同

### 要做

AGENTS、AI_OPERATING_MODEL、DEV_WORKFLOW、PROJECT_RULES、current-state、README 以及必要的上下文消费方同步。

### 不做

新页面、新状态源、路径迁移、历史文档批量重写、发布模型改造。

### 约束

保持 4 文档主干 + 3 状态主源；不把附录重新拉回默认第一跳；不为了修文档再制造新规则。

### 关键风险

如果删错层级，会让 AGENTS 失去必要门禁，或者让迁出内容在目标文档里再次重复。

### 测试策略

- 为什么测：这轮主要改高频执行入口和默认读链，需要验证高频文档职责更单一且消费方不掉链。
- 测什么：needle 搜索、README 默认读链、build-context / ai-rewrite-context 输入列表，以及 lint/test/build/validator。
- 不测什么：不做 UI 视觉测试，不批量迁移历史文档。
- 当前最小集理由：沿用现有 docs/test/build 门禁和定点搜索，足够验证执行入口收口，不需要重型测试层。

## 交付结果

- 状态：done
- 体验验收结果：
  用户确认 `AGENTS` 已经收成真正的一屏执行入口；高价值内容保留在执行原则、默认读链和最小门禁中，runbook、交互契约、专项治理和运行事实已迁到各自主源。
- 交付结果：
  `AGENTS` 只保留执行原则、默认读链、改动门禁与人工备注；`AI_OPERATING_MODEL`、`DEV_WORKFLOW`、`PROJECT_RULES`、`current-state` 接住迁出的内容；旧的粗细混杂结构被拆开，默认高频阅读链更短。
- 复盘：
  `AGENTS` 只适合作为执行入口，不适合继续承担 runbook、交互契约和专项治理。后续若继续瘦身，优先继续找“会不会改变动作”，而不是继续修辞。
