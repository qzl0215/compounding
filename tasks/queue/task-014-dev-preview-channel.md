# 建立 dev 预览与验收发布链

## 目标

把当前“改动后直接发布 main”的习惯升级为“先 dev 预览、验收通过后再晋升到 main 与生产”的双通道模型，并用脚本门禁与页面提示把这套习惯尽量代码化固化。

## 为什么

当前仓库已经具备 release registry、本地生产运行时与发布页，但还缺一个明确的待验收预览通道。用户需要先看到 dev 预览链接，再决定是否发布到 main 和本地生产；同时每次改动都必须强绑定并更新 task，不能只靠口头约定。

## 范围

- 扩展 release registry，支持 `dev / prod` 通道与验收状态
- 增加 dev 预览 runtime、dev 预览链接与验收/驳回动作
- 强化 task 更新门禁与 task/Git 一致性校验
- 更新发布页、任务页、首页风险提示与规则文档

## 范围外

- 不引入远端 CI/CD 平台
- 不把 `dev` 变成长期 git 主分支
- 不扩展独立数据库或后台管理系统

## 约束

- `main` 仍是唯一生产主线
- `dev` 只是 preview channel，不是长期主分支
- 页面和聊天都可触发验收，但 release registry 和 task 文件是唯一真相源
- 所有改动必须绑定并更新 task

## 关联模块

- `scripts/release/*`
- `scripts/local-runtime/*`
- `scripts/ai/validate-change-trace.ts`
- `scripts/ai/validate-task-git-link.ts`
- `apps/studio/src/modules/releases/*`
- `apps/studio/src/modules/tasks/*`
- `apps/studio/src/modules/portal/*`

## 当前模式

工程执行

## 分支

`codex/task-014-dev-preview-channel`

## 最近提交

`auto: branch HEAD`

## 计划

- 先把文档规则与当前主线切换到 dev 预览通道模型
- 再扩展 release registry、runtime 与发布页，形成 pending dev 验收链路
- 最后补 task 门禁、页面提醒和本地发布验证

## 发布说明

本任务会调整本地发布与验收流程，需要在完成后重新 prepare、switch 并给出 dev 与 production 两套验收链接。

## 验收标准

- 每次改动默认先生成 dev 预览链接；若已有未验收 dev，会先提醒用户验收上一个 dev
- 用户验收通过后，能晋升到 main 与本地生产，并再次提供生产验收链接
- 有代码改动但未更新 task 时，校验器直接失败
- 发布页明确显示当前待验收 dev、当前生产版本与是否允许继续出新预览
- 规则文档不再同时出现“main 直发无 dev”和“先 dev 再 main”的冲突描述

## 风险

- 如果 dev 预览与 production 运行态管理不当，容易产生版本漂移或端口冲突
- 如果 task 门禁过严但提示不清，会降低开发效率
- 如果聊天与页面动作未共用同一 registry，容易形成双真相源

## 状态

doing

## 更新痕迹

- 记忆：`memory/project/current-state.md`
- 索引：`no change: no index impact`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-014-dev-preview-channel.md, AGENTS.md, docs/DEV_WORKFLOW.md, docs/AI_OPERATING_MODEL.md, docs/PROJECT_RULES.md`

## 复盘
