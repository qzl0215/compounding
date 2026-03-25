---
title: ROADMAP
update_mode: manual
status: active
last_reviewed_at: 2026-03-26
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

portal 读模型聚合层收薄

## 里程碑成功标准

- `portal/builders.ts` 退化为薄 barrel，首页摘要、Kernel/Project snapshot 与运行态翻译不再挤在单文件里
- 首页、任务页和发布页共享的读模型边界保持兼容，不新增状态源
- 不新增新状态源、重型框架或平行读模型
- 本地 production 继续稳定，且保持无 `pending dev`

## 当前优先级

推进 `t-061`：收薄 `portal` 读模型聚合层，先把 `builders.ts` 拆成内部模块与薄 barrel。

## 下一阶段方向

- `t-061` 完成后，再评估 release 兼容壳是否仍值得继续下沉，或是否继续切 portal 的更细共享 helper
- 继续在不增加新状态源的前提下退休低价值解释层和重复外壳
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
