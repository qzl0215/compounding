# 任务 task-050-doc-structure-rationalization

## 任务摘要

- 短编号：`t-050`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  高频文档结构合理化
- 为什么现在：
  高频阅读文档仍然混合硬规则、路由、runbook 和状态，默认读链过宽，会持续增加认知负担和重复维护成本。
- 承接边界：
  把高频阅读面收成 4 文档主干 + 3 状态主源，并同步默认读链与消费方；不新增新文档族，不改路径。
- 完成定义：
  AGENTS、WORK_MODES、DEV_WORKFLOW、ARCHITECTURE、roadmap、current-state、operating-blueprint 的职责单一，README 与默认上下文读取链按新骨架收口。

## 执行合同

### 要做

高频文档正文、README、build-context、ai-rewrite-context、bootstrap/manifest 元数据、相关 project memory 回写。

### 不做

新页面、新状态源、路径迁移、历史文档批量改写、UI 交互调整。

### 约束

保持 4 文档主干 + 3 状态主源；附录文档继续存在但退出默认高频链；不顺带扩流程系统。

### 关键风险

如果职责切分不清，会让 README、上下文构建和文档门户继续读取错误主源，造成新的重复或遗漏。

### 测试策略

- 为什么测：这轮主要改默认读链和文档主源边界，需要验证消费方没有继续读取旧骨架。
- 测什么：校验高频文档 needle、README 默认读链、build-context 与 ai-rewrite-context 的输入列表，以及现有 docs/test 门禁。
- 不测什么：不新增 UI 视觉测试，不批量重写历史文档。
- 当前最小集理由：以最小 needle 搜索和现有 lint/test/build 门禁验证结构收口，避免为文档改造再造重型测试层。

## 交付结果

- 状态：doing
- 体验验收结果：
  
- 交付结果：
  
- 复盘：
  
