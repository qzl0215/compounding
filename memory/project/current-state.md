---
title: CURRENT_STATE
doc_role: memory
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-17
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-019-gstack-practices-milestone.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 当前状态

## 项目概览

- 项目名称：Compounding AI Operating System
- 当前阶段：gstack 高价值实践七项落地里程碑
- 当前优先级：把“7 个高价值实践”转成可持续推进的任务批次，建立从规则、任务、验证到经验沉淀的闭环。
- 成功定义：7 个实践全部有对应任务与验收证据；高频执行链路默认按模式化协作运行，且 task / memory / docs / code_index 不发生事实漂移。
- 必须保护：AGENTS.md 是唯一主源，Git 文件即真相，关键改动先 review 再写入，不引入平行规则体系，发布失败不影响当前线上版本
- 运行边界：server-only

## 使命与愿景

- 使命：把当前仓库升级成适合 AI 长期协作、任务驱动、可持续重构与自进化的 AI-Native Repo。
- 愿景：让这个项目既像创业团队一样高效推进，又能把经验、结构和发布能力持续沉淀成复利系统。

## 核心价值观

- 规则服务于效率，不服务于扩张
- 持续抓重点，不过度优化
- 少条条框框，但井井有条

## 当前焦点

- [x] 建立 3 种高频协作模式并绑定任务状态驱动
- [x] 为高频链路接入统一 preamble 与提问契约
- [x] 把分层验证和 diff-aware QA 绑定现有门禁入口
- [x] 在 review / ship 落地 Fix-First 分流规则并持续收敛
- [x] 落地模板生成防漂移与工具体验反馈闭环
- [ ] 开启下一阶段里程碑并持续迭代 AI-Native OS

## 当前推荐校验顺序

- 静态门禁：`pnpm validate:static`
- 构建门禁：`pnpm validate:build`
- 运行时门禁：
  - `pnpm preview:check`
  - `pnpm prod:check`
- AI 输出门禁：`pnpm validate:ai-output`（仅在 prompt / AI 重构链路变动时进入）

## 关键冻结项

- 不恢复旧 workflow 前台和重型多步骤表单
- 不把 task 演化成审批流或重型工单系统
- 不新增平行读模型或后台数据库
- 不以一次大改替代批次推进与逐步验收

## 下一检查点

- 完成 `t-019` 编排并推进 `t-020`、`t-021`、`t-022`、`t-023`、`t-024` 进入执行
- 输出 7 个实践点的“当前完成度 / 风险 / 下一动作”看板快照
- 完成首批高 ROI 子任务并通过统一门禁链路
- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
