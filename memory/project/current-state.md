---
title: CURRENT_STATE
doc_role: memory
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-15
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
- 当前阶段：经营驾驶舱首页与认知分层收口
- 当前优先级：把首页收口成经营驾驶舱，并建立 roadmap / operating-blueprint / task / memory / index 的清晰分层，同时恢复 Markdown 的自然阅读层级。
- 成功定义：首页成为一页经营驾驶舱；用户与 AI 能快速看懂使命、路线图、运营蓝图、组织职责与认知资产边界，并能沿统一 task 闭环持续推进。
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

- 首页收口成经营驾驶舱，让使命、路线图、运营蓝图、组织职责和风险一页可读
- 新增 `memory/project/operating-blueprint.md`，把里程碑拆解与发布标准从 roadmap 中剥离
- 恢复 Markdown 的自然文档层级，不再让标题样式覆盖正文结构
- 保持 task / memory / code_index / roadmap 的回写闭环，不引入新的平行体系

## 关键冻结项

- 不恢复旧 workflow 前台和重型多步骤表单
- 不把 task 演化成审批流或重型工单系统
- 不新增平行读模型或后台数据库

## 下一检查点

- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`
- `node --experimental-strip-types scripts/ai/validate-change-trace.ts`

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
