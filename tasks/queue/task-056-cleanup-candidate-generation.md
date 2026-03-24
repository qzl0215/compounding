# 任务 task-056-cleanup-candidate-generation

## 任务摘要

- 短编号：`t-056`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把持续垃圾回收收口成轻量候选生成器，而不是新 backlog 系统
- 为什么现在：
  仓库已经具备 code health、技术债和知识资产校验，但还缺少一个低成本出口去持续暴露可在单个 task 内闭环的小型熵减机会。
- 承接边界：
  只聚合现有扫描结果与技术债信号，生成一次性 cleanup 候选报告；不自动建 task、不自动改代码、不引入 automation infra 或后台 agent。
- 完成定义：
  `pnpm ai:cleanup-candidates` 能稳定输出低风险熵减候选及 why-now，且触发时机已写入 AI operating model 与 workflow。

## 执行合同

### 要做

- 新增 cleanup candidate 生成脚本。
- 从 code health、knowledge freshness、code volume 与 tech debt 提取候选。
- 固定单模块或单文档簇、无 runtime topology 变更的筛选规则。
- 补对应自动化测试与文档说明。

### 不做

- 不自动创建 task。
- 不自动修改代码。
- 不引入后台定时任务或新的长期状态源。

### 约束

- 输出只写到 `output/` 下的临时报告。
- 候选必须可在一个 `light` 或单个 `structural` task 内闭环。
- 仍由单一 plan 决定是否转成执行 task。

### 关键风险

- 若筛选规则过宽，cleanup 报告会重新膨胀成 backlog。
- 若候选来源不可解释，报告会失去行动价值。

### 测试策略

- 为什么测：cleanup generator 会影响后续 planning 入口，必须保证筛选、排序与输出边界稳定。
- 测什么：候选筛选、排序、去重、why-now 生成与 `output/` 路径约束。
- 不测什么：不做自动建 task 或自动修复链路测试。
- 当前最小集理由：只验证真正会影响 planning 选择的候选输出，不扩成新的治理平台测试。

## 交付结果

- 状态：done
- 体验验收结果：
  `pnpm ai:cleanup-candidates` 已能从 code health、knowledge freshness、code volume 与技术债中生成一次性 cleanup 候选报告，并限制在单模块或单文档簇、无 runtime topology 变更、可在一个 task 内闭环的范围内。
- 交付结果：
  已新增 cleanup candidate 生成脚本与输出报告；`docs/AI_OPERATING_MODEL.md` 和 `docs/DEV_WORKFLOW.md` 已写明它只在计划评审、release 复盘或当前无更高优先级产品任务时运行，且不会自动建 task 或新建状态源。
- 复盘：
  持续垃圾回收最容易失控成 backlog；真正需要的是一个可解释的瞬时候选出口，而不是再长一套常驻治理系统。

## 当前模式

工程执行

## 分支

`main`

## 关联模块

- `scripts/ai/`
- `memory/project/`
- `docs/`

## 更新痕迹

- 记忆：`memory/project/operating-blueprint.md`, `memory/project/roadmap.md`, `memory/project/current-state.md`
- 索引：`no change: no generated code_index change required`
- 路线图：`memory/project/roadmap.md`
- 文档：`docs/AI_OPERATING_MODEL.md`, `docs/DEV_WORKFLOW.md`, `tasks/queue/task-056-cleanup-candidate-generation.md`
