---
title: ROADMAP
doc_role: planning
update_mode: manual
status: active
last_reviewed_at: 2026-03-12
source_of_truth: bootstrap/project_brief.yaml
related_docs:
  - AGENTS.md
  - docs/planning/backlog.md
  - docs/memory/decisions.md
  - docs/reference/architecture.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Roadmap

## Current Focus

- 当前优先级：加固 AGENTS 单主源验收与自动校验，确保主源、roadmap 与执行链始终一致。
- 成功定义：任何新线程先读 AGENTS.md 即可进入统一执行协议；低频知识有明确归宿，新经验有升格闭环，旧体系不再混入默认阅读链。

## Active Milestones

- 把 `AGENTS.md` 的单主源定位收敛成可验收、可审计的规则
- 把 roadmap 到 AGENTS 的同步关系变成自动校验，而不是靠人工记忆
- 把记忆升格、mutation gate 和 UI 入口继续收口成稳定闭环

## Priority Ladder

### P1. AGENTS 单主源

验收标准：
- `AGENTS.md` 持续包含 `Stable Rules / Current State / Default Response Format / Mutation Gate / Read More If...`
- 默认阅读链始终从 `AGENTS.md` 开始
- 任何 live docs 都不能与 `AGENTS.md` 竞争高频执行真相源

### P2. roadmap 到 AGENTS 的同步闭环

验收标准：
- `docs/planning/roadmap.md` 是当前阶段排序真相源
- `AGENTS.md > Current State` 必须镜像 roadmap 的当前优先级与成功定义
- `docs/planning/backlog.md` 不得与 roadmap 竞争当前主线

### P3. memory 升格闭环

验收标准：
- 新经验先写 `docs/memory/memory-ledger.md`
- 稳定经验才允许升格进 `AGENTS.md` 或 `docs/reference/*`
- 若现有规则限制复利效率，可直接更新规则，但必须同步写入 `docs/memory/decisions.md` 和相关 live docs
- `decisions / tech-debt / evolution-log` 的边界清晰，不混写成第二套主源

### P4. mutation gate 纪律

验收标准：
- 改动前必须存在可运行的 `scripts/pre_mutation_check.py`
- `execution-system` 与 `schemas-and-contracts` 都明确写出 preflight 契约
- proposal/apply 和人工改动都必须遵守同一套 git 纪律

### P5. 只读门户为小白服务

验收标准：
- 首页默认暴露 `AGENTS / roadmap / memory` 三个入口
- 文档页默认打开 `AGENTS.md`
- archive 只保留历史，不进入默认阅读链

## Current Execution TODOs

- [x] 为 `AGENTS` 单主源和 roadmap 同步关系增加自动 audit 校验
- [x] 为 memory 升格与 backlog 边界增加自动 audit 校验
- [x] 持续把首页和文档门户保持为 `AGENTS / roadmap / memory` 三入口模型
- [x] 明确 memory 升格 / 直接改规判定标准，并纳入 audit 校验
- [ ] 在 foundation 规则稳定前，不扩新的治理模块或工作流前台

## Long-Term Compounding Axes

- 让小白更快用好 agent
- 减少项目初始化的管理成本
- 把治理知识沉到底层自动执行

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/planning/roadmap.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
