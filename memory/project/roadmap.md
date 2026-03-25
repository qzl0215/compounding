---
title: ROADMAP
update_mode: manual
status: active
last_reviewed_at: 2026-03-27
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

portal 首页 shell 收薄

## 里程碑成功标准

- `home-dashboard.tsx` 退化为薄 shell，首页 tab 入口与 panel 展示不再挤在单文件里
- 首页默认 Project Tab 和 Kernel/Project 语义保持兼容，不新增状态源
- 不新增新状态源、重型框架或平行读模型
- 本地 production 继续稳定，且保持无 `pending dev`

## 当前优先级

推进 `t-062`：收薄 `portal` 首页 shell，先把 `home-dashboard.tsx` 拆成薄入口与面板模块。

## 下一阶段方向

- `t-062` 完成后，再评估 types.ts 或 home-dashboard test 是否值得继续收薄，或是否回看 release 兼容壳剩余边界
- 继续在不增加新状态源的前提下退休低价值解释层和重复外壳
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
