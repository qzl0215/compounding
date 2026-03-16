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
- 当前阶段：AI 工作模式产品化
- 当前优先级：把工作模式从角色文档中剥离成独立真相源，并让首页、`AGENTS`、任务模板和 AI 工作流入口沿统一业务链承接这些模式。
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

- 把工作模式从角色文档中剥离成独立真相源
- 让首页用清晰流程链承接工作模式，而不是继续展示模式卡片
- 让 `AGENTS` 只保留工作模式摘要，详细输入输出收口到 `WORK_MODES`
- 让 task 通过 `当前模式` 字段和业务链联动
- 保持角色与模式边界清楚，避免再次混写

## 关键冻结项

- 不恢复旧 workflow 前台和重型多步骤表单
- 不把 task 演化成审批流或重型工单系统
- 不新增平行读模型或后台数据库

## 下一检查点

- 首页用流程链清晰呈现工作模式入口
- `docs/ORG_MODEL.md` 只保留角色定义
- `docs/WORK_MODES.md` 成为工作模式唯一详细真相源
- `docs/AI_OPERATING_MODEL.md` 与 `AGENTS` 对工作模式摘要保持一致
- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
