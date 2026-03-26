# 统一知行判断合同与人类友好入口

## 任务摘要

- 任务 ID：`task-073`
- 短编号：`t-073`
- 父计划：``
- 任务摘要：
  统一知行判断合同与人类友好入口
- 为什么现在：
  让规划、AI执行链和Studio展示读取同一套判断语义，并把AI feature入口和三模式外部入口收成默认工作流
- 承接边界：
  只复用现有 project-state、feature-context、bootstrap/doctor、Studio 页面与 operator asset 生成链；不新增数据库或重型向导
- 完成定义：
  project-state/UI/AI/doctor 对关键判断字段一致；feature-context 输出默认执行建议；runbook 明确三模式入口；最小 golden matrix 覆盖三模式 smoke

## 执行合同

### 要做

共享 judgement contract；Studio 共用判断条；feature-context 默认回路；三模式 docs-first 入口；最小 golden matrix 测试

### 不做

新增后台表、复杂安装器、重做首页视觉、支持更多 adapter 类型

### 约束

AI代码侧保持薄层复用；人类UI保持浅色实验室语气和首屏判断优先；不新增第二套状态源

### 关键风险



### 测试策略

- 为什么测：这是结构性收口，需验证共享判断、Bootstrap 三模式和页面展示一致性
- 测什么：python3 -m unittest tests.test_bootstrap_scaffold_cli tests.test_bootstrap_proposals_cli tests.test_ai_assets_cli && pnpm --filter studio test -- apps/studio/src/modules/project-state/__tests__/service.test.ts apps/studio/src/modules/portal/__tests__/service.test.ts apps/studio/src/modules/portal/__tests__/home-dashboard.test.tsx && pnpm ai:validate:static:summary
- 不测什么：
- 当前最小集理由：

## 交付结果

- 状态：
- 体验验收结果：
  
- 交付结果：
  
- 复盘：
  

## 当前模式

工程执行

## 分支

`codex/task-073`

## 关联模块



## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：no change: 未更新
