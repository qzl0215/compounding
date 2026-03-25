---
title: ROADMAP
update_mode: manual
status: active
last_reviewed_at: 2026-03-25
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

## 当前优先级

优先沿着 `t-066` 的结果继续把 AI 加功能入口收短：保持模块合同、feature context、共享状态摘要和选测输出的单一口径，再继续压 `pnpm preflight` 单入口和 release 单一状态机。

## 下一阶段方向

- 继续压实 `pnpm preflight` 单入口，减少 task guard / pre-task / decision card 的多入口感
- 继续压跨页面唯一 snapshot，避免首页 / 任务页 / 发布页重新长出本地翻译
- 继续把 AI 加 feature 的默认上下文收成更短、更稳定的入口
- 继续在不增加新状态源的前提下退休低价值解释层和重复外壳
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
