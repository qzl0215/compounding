# 任务 task-066-feature-context-and-shared-state

## 任务摘要

- 短编号：`t-066`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  AI feature 开发提效
- 为什么现在：
  当前 AI 加功能仍需要跨 AGENTS、memory、task、module.md、code_index 和 service 自己拼上下文；先补模块合同、feature context、共享状态摘要和选测闭环，能直接减少首轮搜索和二次返工。
- 承接边界：
  只改高频模块 module.md、scripts/ai 上下文入口、共享状态摘要与选测逻辑；不改数据库、不加新页面、不重写 bootstrap 流。
- 完成定义：
  AI 在没有 task 时也能直接拿到 feature 上下文；首页、任务页、发布页开始读取共享项目状态摘要；模块合同能直接告诉 AI 该改哪里、该跑什么。

## 执行合同

### 要做

- 高频模块 `module.md` 结构化
- feature context CLI
- 项目状态共享 snapshot
- `SelectedChecks` 选测逻辑

### 不做

- 新数据库或配置中心
- portal 视觉重做
- bootstrap 大改版

### 约束

只做当前仓库高 ROI 提效；不新增重型框架；code_index 继续只是缓存。

### 关键风险

如果模块合同写成说明书或共享状态摘要切得过大，会再次制造新外壳；如果选测逻辑接入点选错，会让默认验证变重。

### 测试策略

- 为什么测：这轮改的是 AI feature 开工入口与跨页面状态摘要，最容易回退的是上下文结构、状态口径和校验选择。
- 测什么：
  - feature context smoke tests
  - 模块合同解析 tests
  - 状态摘要一致性 tests
  - lint / test / build / validators
- 不测什么：
  - 不新增 UI e2e
  - 不重写 bootstrap proposal 流测试
- 当前最小集理由：先锁住 AI 首轮上下文命中率和跨页面状态一致性，足以验证本轮提效价值。

## 交付结果

- 状态：done
- 体验验收结果：
  feature context 已能在无 task / 有 task 两条路径输出统一 packet；首页、任务页、发布页已经读取同一份项目状态摘要；required / recommended 选测也已在交付面板落地。
- 交付结果：
  高频模块合同、feature context、共享状态摘要和 required / recommended 选测已经接入当前仓库主链，并已随 `main` 发布到本地 production；AI 加功能时不必再手工拼第一轮上下文。
- 复盘：
  这轮真正值钱的是把“加一个 feature 先读什么、先改哪里、先跑什么”收成了可机读闭环。真正的长期复利不在再写规则，而在继续把 default context、状态摘要和选测入口压成单一主链。

## 当前模式

工程执行

## 分支

`codex/task-066-feature-context-and-shared-state`

## 关联模块

- `apps/studio/src/modules/portal/`
- `apps/studio/src/modules/tasks/`
- `apps/studio/src/modules/releases/`
- `apps/studio/src/modules/delivery/`
- `apps/studio/src/modules/docs/`
- `scripts/ai/`
- `scripts/compounding_bootstrap/`
- `shared/`

## 更新痕迹

- 记忆：memory/project/current-state.md, memory/project/roadmap.md, memory/project/operating-blueprint.md
- 索引：code_index/module-index.md, code_index/dependency-map.md, output/pipeline/state/code-volume/latest.md
- 路线图：memory/project/roadmap.md
- 文档：apps/studio/src/modules/*/module.md, docs/ARCHITECTURE.md
