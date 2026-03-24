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

AI Script Surface Simplification（持续收口）

## 当前里程碑

`scripts/ai` 共享 CLI 外壳落地

## 里程碑成功标准

- `template-feedback`、`fix-first` 和 `create-task` 共用一套参数解析、标准输出、错误出口和 task 模板渲染
- 共享内核只承接 CLI 外壳，不引入新的脚本框架或状态源
- 现有脚本行为、门禁和模板语义保持兼容

## 当前优先级

推进 `t-058`：把 `scripts/ai` 的重复编排逻辑收口到一个极薄共享内核。

## 下一阶段方向

- 在 `scripts/ai` 外壳收口后，再评估 portal 读模型聚合点是否值得继续拆分
- 继续压低兼容层和静态噪音，优先收真正会继续制造对象歧义的入口
- 继续在不增加新状态源的前提下退休低价值解释层和脚本重复层
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
