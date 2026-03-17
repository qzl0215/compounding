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
- 当前阶段：强化运行态状态解释与告警体验
- 当前优先级：强化运行态状态解释与告警体验，让服务未启动、版本漂移、端口异常与状态失真都能被页面和状态接口清楚解释。
- 成功定义：用户无需读日志，也能通过页面理解当前服务状态、版本状态与下一步动作；首页风险区与发布页对运行态语义保持一致。
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

- 盘点发布页、首页风险区与运行态状态接口之间的表达缺口
- 收口运行态问题的分类、文案与下一步动作建议
- 让非技术用户也能快速理解“服务未启动 / 漂移 / 端口异常 / 状态失真”
- 保持刚完成的知识资产防漂移机制继续稳定可用

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

- 明确 `/releases` 与首页风险区的运行态信息边界
- 为常见运行态问题建立更清晰的状态分类与告警语义
- 保持 `dev` 预览和 production 发布链继续可解释、可回退
- 保持 `dev` 预览和 production 发布链继续可解释、可回退
- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
