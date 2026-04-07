# 任务标题改成中文直给概述

## 任务摘要

- 任务 ID：`task-067-task-title-chinese-summary`
- 短编号：`t-067`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  任务标题改成中文直给概述
- 为什么现在：
  当前 task 展示标题默认落在英文 task id 或混合英文摘要上，既影响阅读效率，也让任务列表失去人类可扫读性。先把标题展示、模板和创建入口统一成中文直给概述，能直接降低任务理解成本。
- 承接边界：
  只收口 task 标题命名规则：让任务展示标题优先使用中文摘要，更新 task 模板、create-task 校验和高频文档；不批量重写历史 task 内容，不改 task id/短编号 contract。
- 完成定义：
  新建 task 默认以中文直给概述作为标题；create-task 会拦截含英文字符的标题摘要；任务解析与 Studio/脚本侧展示不再把英文 task id 当成人类标题。

## 执行合同

### 要做

- `tasks/templates/task-template.md`
- `scripts/ai/create-task.ts`
- `scripts/ai/lib/task-template.js`
- `shared/task-contract.ts`
- 相关测试与高频文档

### 不做

- 批量重写历史 task 文件内容
- 修改 task id、短编号或文件命名 contract
- 任务页之外的 UI 文案改名

### 约束

- 保持 task id 与短编号解析规则不变
- 保持历史 task 可兼容解析
- 标题规则优先服务可读性，不增加额外人工步骤

### 关键风险

- 如果标题回退逻辑处理不好，历史 task 可能显示空标题或错误标题
- 如果校验过严，可能拦住带必要技术名词的 task 创建

### 测试策略

- 为什么测：这轮改的是 task 展示入口和创建门槛，最容易回归的是历史任务兼容解析和 create-task 的输出 contract。
- 测什么：任务解析标题优先级、新 task 模板标题、create-task 对英文摘要的拦截与正常中文创建路径。
- 不测什么：不做历史任务批量迁移测试，不改 release/runtime 相关流程。
- 当前最小集理由：只要锁住标题回退和创建校验，后续 task 列表与门户读取都能稳定获益。

## 交付结果

- 状态：done
- 体验验收结果：
  新标题规则已经在 `main` 上通过创建脚本、任务解析、Studio 任务读模型以及整仓静态/构建门禁验证；任务列表与相关摘要入口不再把英文 task id 当人类标题。
- 交付结果：
  `create-task` 已拦截含英文字符的任务标题摘要；task 模板改为直接把中文摘要作为文档标题；共享 task contract 会把历史 `任务 task-xxx` 机器壳标题回退到摘要；整仓 service 测试超时也已补到可稳定跑完全仓快照。
- 复盘：
  任务命名真正该收口的是“人类标题从哪里来”，不是去批量改历史文件名；只要创建入口和解析回退统一，旧任务也能马上变得可读。

## 当前模式

发布复盘

## 分支

`main`

## 关联模块

- `tasks/templates/task-template.md`
- `scripts/ai/create-task.ts`
- `scripts/ai/lib/task-template.js`
- `shared/task-contract.ts`
- `apps/studio/src/modules/tasks/__tests__/contract.test.ts`
- `apps/studio/src/modules/tasks/__tests__/service.test.ts`
- `apps/studio/src/modules/releases/__tests__/service.test.ts`
- `apps/studio/src/modules/portal/__tests__/service.test.ts`
- `apps/studio/src/modules/delivery/__tests__/service.test.ts`
- `apps/studio/src/modules/project-state/__tests__/service.test.ts`
- `AGENTS.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `memory/project/current-state.md`
- `memory/project/roadmap.md`
- `tests/coord_support.py`
- `tests/test_coord_cli.py`

## 更新痕迹

- 记忆：updated current-state / roadmap to reflect the task-title readability focus
- 索引：no change: 未更新
- 路线图：updated roadmap priority to include Chinese task-title readability
- 文档：updated AGENTS / DEV_WORKFLOW / AI_OPERATING_MODEL / task template for Chinese human-title rule
