---
title: CURRENT_STATE
doc_role: memory
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-16
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-001-repo-refactor.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 当前状态

## 项目概览

- 项目名称：Compounding AI Operating System
- 当前阶段：建设防漂移文档与索引资产
- 当前优先级：建设防漂移文档与索引资产，优先盘点 prompt、索引与关键说明文档，明确哪些走生成、哪些走校验、哪些继续人工维护。
- 成功定义：高频知识资产的真相源、维护方式与回退边界清楚；至少一类资产具备可执行的防漂移机制，且不引入新的平行真相源。
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

- 先建立一份资产维护矩阵，明确生成 / 校验 / 人工维护三分法
- 为 prompt 资产建立单一注册表，并让运行时代码与校验器共用它
- 把 `code_index` 的生成边界与人工补充边界写清楚，避免再次手改漂移
- 保持刚完成的 `dev preview → 验收 → main / production` 链路稳定可解释

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

- 生成 `docs/ASSET_MAINTENANCE.md`
- 落地 prompt 资产注册表与对应校验
- 把 `code_index` 的维护命令与边界写回规则文档
- 保持 `dev` 预览和 production 发布链继续可解释、可回退
- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
