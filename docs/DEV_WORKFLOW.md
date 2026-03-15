---
title: DEV_WORKFLOW
doc_role: operation
update_mode: manual
owner_role: Builder
status: active
last_reviewed_at: 2026-03-15
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/AI_OPERATING_MODEL.md
  - tasks/templates/task-template.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# DEV_WORKFLOW

## Branch And Worktree Rule

- 结构性改动必须在独立 worktree / branch 中完成
- 当前标准分支名：`codex/ai-native-repo-refactor`
- 不允许直接在主线做结构升级

## Standard Flow

1. 先读 `AGENTS.md`
2. 再读 `docs/PROJECT_RULES.md`、`docs/ARCHITECTURE.md`
3. 再读当前任务文件、相关 `module.md`、`code_index/*`
4. 运行 `python3 scripts/pre_mutation_check.py`
5. 完成最小可验证改动
6. 更新 `task / memory / code_index / docs`
7. 提交 PR

## Reporting Contract

- 默认回复结构：
  - 已完成清单
  - 证据与当前结论适用边界
  - 风险与待决策
  - 下一步
- 所有关键报告必须显式区分：
  - 本地离线证据
  - 服务器真实证据
  - 当前结论适用边界

## Task Rule

- 每个结构性改动必须绑定 `tasks/queue/*`
- 任务至少包含 Goal / Why / Scope / Out of Scope / Constraints / Related Modules / Acceptance Criteria / Risks / Status
- 修改结束后要同步更新任务状态和验收结果

## PR Rule

- 结构升级必须通过 PR 合并
- PR 必须说明删除了什么、保留了什么兼容层、还有哪些技术债
- 任何新抽象都必须解释职责和删除条件

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
