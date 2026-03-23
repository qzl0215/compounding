---
title: DOCS_README
doc_role: reference
update_mode: manual
status: active
last_reviewed_at: 2026-03-12
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/reference/architecture.md
  - docs/memory/memory-ledger.md
  - docs/planning/roadmap.md
---

<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Docs README

## 这套 live 文档怎么读

- `AGENTS.md` 是唯一高频执行主源。
- `docs/reference/*` 只放稳定的系统知识，不接收临时经验。
- `docs/operations/*` 只放输入输出规范与模板。
- `docs/memory/*` 先记、后筛、再升格。
- `docs/planning/*` 负责当前阶段排序，不与 `AGENTS.md` 竞争真相源。
- `docs/archive/v1/*` 只保留历史，不进入默认阅读链。

## 当前项目目标

- 当前优先级：加固 AGENTS 单主源验收与自动校验，确保主源、roadmap 与执行链始终一致。
- 成功定义：任何新线程先读 AGENTS.md 即可进入统一执行协议；低频知识有明确归宿，新经验有升格闭环，旧体系不再混入默认阅读链。
- 推荐阅读顺序：`AGENTS.md` -> `docs/planning/roadmap.md` -> 命中任务后再补读 `reference/` 或 `operations/`

## 回写方向

1. 新经验先进 `docs/memory/memory-ledger.md`
2. 有明确裁决的问题先进 `docs/memory/decisions.md`
3. 当前阶段排序进 `docs/planning/roadmap.md`
4. 稳定知识才提升进 `docs/reference/*` 或 `AGENTS.md`

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->

<!-- BEGIN MANAGED BLOCK: RATIFIED_NOTES -->
## Ratified Notes

- 该文档当前没有额外 ratified notes。后续通过 proposal apply 增量写入。
- File: `docs/README.md`
<!-- END MANAGED BLOCK: RATIFIED_NOTES -->

## Manual Notes

人工补充内容写在这里。`scaffold` 只更新 managed blocks，不覆盖这一区域。
