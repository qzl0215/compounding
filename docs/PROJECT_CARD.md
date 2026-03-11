---
title: PROJECT_CARD
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-11
source_of_truth: bootstrap/project_brief.yaml
related_docs:
  - docs/OPERATING_RULES.md
  - docs/PLAYBOOK.md
  - docs/MEMORY_LEDGER.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Project Card

## 项目定义

- 项目名称：Compounding AI Operating System
- 项目一句话：用轻内核和专业前台，让小白用户也能高性价比地用好 agent。
- 当前优先级：完成 V2 的轻 brief、任务工作台和摘要审批体验。
- 成功定义：小白用户不需要理解复杂规范，也能用这个系统快速初始化项目、发起任务并安全审批关键改动。
- 必须保护：Git 文件即真相, 关键改动先 review 再写入, 不引入平行规则体系
- 运行边界：server-only

## Repo Snapshot

- 语言：Markdown, Python, TypeScript
- 包管理器：pnpm
- Build Command：pnpm build
- Test Command：pnpm test
- 主要目录：apps, tests

## 建议下一步

1. 在 Tasks 页面输入第一个目标。
2. 用 Review 页面确认 agent 产出的实质性改动。
3. 只在需要时展开 Advanced，看规则原文和完整 diff。

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/PROJECT_CARD.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
