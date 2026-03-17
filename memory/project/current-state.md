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
  - tasks/queue/task-018-home-unified-cockpit.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 当前状态

## 项目概览

- 项目名称：Compounding AI Operating System
- 当前阶段：首页统一驾驶舱一期
- 当前优先级：把首页升级为人类优先的统一项目驾驶舱，让项目主线、推进状态、风险与证据入口在同一页对齐，并保持与 AI 读取的主源一致。
- 成功定义：不会代码的产品、运营或负责人打开首页后，也能在 1 分钟内理解项目是什么、当前最重要的事、现在卡在哪、下一步该去哪里看；首页摘要与详情页之间不发生事实漂移。
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

- 对齐 `AGENTS`、`roadmap`、`operating-blueprint`、`current-state` 的当前主线描述
- 把首页从信息门户升级为 5 区块统一驾驶舱
- 把任务与运行态信息翻译成产品/运营能快速理解的摘要
- 保持详情页继续承接文档、任务和发布操作，不长出新的平行真相源

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

## 下一检查点

- 确认首页 5 个区块的固定边界与证据落点
- 完成统一驾驶舱快照接口与首页渲染测试
- 保持 `/tasks`、`/knowledge-base`、`/releases` 与驾驶舱叙事一致
- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
