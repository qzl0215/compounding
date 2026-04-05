---
title: ROADMAP
update_mode: manual
status: active
last_reviewed_at: 2026-04-05
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - memory/project/operating-blueprint.md
  - docs/WORK_MODES.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 路线图

## 当前阶段

Structural Entropy Reduction（持续收口）

## 当前里程碑

AI feature 开发提效闭环

## 里程碑成功标准

- 高频模块 `module.md` 能稳定解析成 feature 合同
- `feature-context` 在无 task / 有 task 两条路径都能输出统一 packet
- 首页、任务页、发布页对同一项目状态只读一套主摘要，不再各自翻译
- 选测输出能明确区分 required / recommended，不再默认整套 full validation
- 不新增新状态源、后台表或重型同步层
- 结构收口优先于视觉扩张或 bootstrap 漂亮化
- `docs/ARCHITECTURE.md` 里的 core / bootstrap / config 清单成为唯一仓内分类口径，后续 bootstrap / operator / AI 入口不再各自解释职责边界

## 当前优先级

优先继续收短派生产物入口和跨页面读链：`pnpm preflight` 单入口、task 级 retro digest、以及 `bootstrap/project_operator.yaml` 的运维接入合同都已落地，下一步先把 core / bootstrap / config 分类口径写死，再用 `kernel/derived-asset-contract.yaml` 统一 `code_index/*`、`output/*`、coordination 产物和 runtime 事实的语义，让团队只维护“主源 / 派生物”两层心智；随后继续压跨页面唯一 snapshot 和 release 单一状态机。

## 下一阶段方向

- 继续统一派生产物语义，减少 `code_index`、`output`、coordination 与 runtime 各自命名的重复心智，并让 `kernel/derived-asset-contract.yaml` 成为唯一机器合同
- 继续固化 core / bootstrap / config 分类边界，避免 bootstrap / config / runbook 再各写一套职责说明
- 继续压跨页面唯一 snapshot，避免首页 / 任务页 / 发布页重新长出本地翻译
- 继续把 AI 加 feature 的默认上下文收成更短、更稳定的入口
- 继续压实 release 单一状态机，减少 task / release / runtime 之间的兼容壳
- 继续在不增加新状态源的前提下退休低价值解释层和重复外壳
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
