---
title: TECH_DEBT
doc_role: memory
update_mode: append_only
owner_role: Auditor
status: active
last_reviewed_at: 2026-03-15
source_of_truth: docs/REFACTOR_PLAN.md
related_docs:
  - docs/PROJECT_RULES.md
  - docs/REFACTOR_PLAN.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# Tech Debt

## Active Debt

1. 当前已清空超软上限文件，但 proposal 链路仍可继续沿 `generation / patch / git` 三层再下切，给后续增长留余量
2. proposal engine 已支持模型优先生成，但默认仍依赖 `OPENAI_API_KEY + OPENAI_MODEL`；未配置时会回退到 deterministic rewrite
3. `scripts/ai/build-context.ts` 与 `generate-module-index.ts` 仍是轻量版本，后续可继续提高相关性判断和索引精度
4. code health strict gate 已接入 CI，但目前只做规则检查，不做自动修复或 issue 自动创建
5. 当前还没有真正独立 worktree 的强制校验；执行纪律仍主要靠 `DEV_WORKFLOW` 和 preflight

## Delete Plan

- 任何仍然保留的 legacy 文本或兼容路径，都要在下一轮重构中删除或归档
- 任何新增临时层都必须写清删除触发条件
- 仍接近软上限的 bootstrap 模块，在下一轮继续下切

## Evidence Boundary

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
