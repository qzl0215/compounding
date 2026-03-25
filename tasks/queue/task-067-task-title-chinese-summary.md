# 任务 task-067-task-title-chinese-summary

## 任务摘要

- 短编号：`t-067`
- 父计划：``
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

- 状态：
- 体验验收结果：
  
- 交付结果：
  
- 复盘：
  

## 当前模式

工程执行

## 分支

`codex/task-067-task-title-chinese-summary`

## 关联模块



## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
