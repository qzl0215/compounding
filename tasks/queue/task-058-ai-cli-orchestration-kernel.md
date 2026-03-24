# 任务 task-058-ai-cli-orchestration-kernel

## 任务摘要

- 短编号：`t-058`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  scripts/ai 编排内核收口
- 为什么现在：
  当前 scripts/ai 里 template-feedback、fix-first 和 create-task 各自维护参数解析、模板渲染、输出和错误出口，继续放着会放大脚本层重复和维护成本。
- 承接边界：
  为 scripts/ai 提取极薄共享内核，统一参数解析、标准输出、错误出口和 task 模板渲染；先服务 template-feedback-orchestrator、fix-first-orchestrator 和 create-task；不改业务策略，不碰 portal。
- 完成定义：
  scripts/ai 只保留一套共享的 CLI 外壳与 task 模板底座；template-feedback、fix-first 和 create-task 继续保持现有行为，但不再各自重复实现参数解析、输出与错误处理。

## 执行合同

### 要做

- `scripts/ai/lib/` 里的共享 CLI 外壳
- `scripts/ai/template-feedback-orchestrator.js`
- `scripts/ai/fix-first-orchestrator.js`
- `scripts/ai/create-task.ts`
- `tests/test_coord_cli.py`
- 必要的主线文档同步

### 不做

- `portal` 读模型
- 新框架或插件系统
- 新状态源
- 业务规则重写

### 约束

共享内核只抽重复外壳，不改 gate policy、反馈逻辑或 task 合同语义；CLI 向后兼容优先；不引入复杂 class、registry 或新配置中心。

### 关键风险

如果抽取边界过大，会把业务规则和外壳耦到一起，反而制造新的伪框架；如果抽取过小，则重复代码继续存在。

### 测试策略

- 为什么测：这轮会同时改三个 CLI 入口，需要验证文本/JSON 输出、模板渲染和错误退出仍兼容。
- 测什么：- 相关脚本最小 smoke tests\n- lint/test/build\n- validate-change-trace\n- validate-task-git-link
- 不测什么：- 不做新的端到端 UI 测试\n- 不重写业务策略测试
- 当前最小集理由：优先锁住 CLI 行为兼容和共享内核不扩散，足以验证本轮高 ROI 收口。

## 交付结果

- 状态：doing
- 体验验收结果：
  待验收
- 交付结果：
  待交付
- 复盘：
  待复盘

## 当前模式

工程执行

## 分支

`codex/task-058-ai-cli-orchestration-kernel`

## 关联模块

- `scripts/ai/lib/`
- `scripts/ai/template-feedback-orchestrator.js`
- `scripts/ai/fix-first-orchestrator.js`
- `scripts/ai/create-task.ts`
- `tests/test_coord_cli.py`
- `memory/project/current-state.md`
- `memory/project/roadmap.md`
- `memory/project/operating-blueprint.md`


## 更新痕迹

- 记忆：updated current-state / operating-blueprint to focus on t-058 CLI kernel consolidation
- 索引：no change: 未更新
- 路线图：updated roadmap stage and milestone to AI Script Surface Simplification
- 文档：no change: 未更新
