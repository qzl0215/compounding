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

Local Runtime Boundary Simplification（持续收口）

## 当前里程碑

本地 production 脱离 release worktree 运行

## 里程碑成功标准

- 本地 production 运行 cwd 不再指向 release worktree，而是固定 runtime 副本目录
- `accept-dev-release`、`switch-release`、`rollback-release` 都走同一条 prod runtime materialize 路径
- `git worktree list` 可清到只剩主工作区
- release worktree 只承担构建与切换输入，不再承担常驻运行职责

## 当前优先级

推进 `t-053`：让本地 production 从固定 runtime 副本启动，彻底解除对 release worktree 的运行依赖。

## 下一阶段方向

- `Knowledge Freshness and Entropy Cleanup`：把 knowledge asset freshness 做成可执行门禁，并用轻量候选报告持续暴露可在一个 task 内闭环的小型熵减机会
- 再评估 `scripts/ai` 重复编排和兼容层残留，优先收真正会继续制造运行或对象歧义的入口
- 继续压低 release/runtime 边界噪音，避免 current 链接、运行态和实际 cwd 再次分叉
- 继续在不增加新状态源的前提下退休低价值解释层和静态噪音
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
