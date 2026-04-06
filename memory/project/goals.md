---
title: GOALS
update_mode: manual
status: active
source_of_truth: memory/project/goals.md
related_docs:
  - AGENTS.md
  - memory/project/current-state.md
  - docs/WORK_MODES.md
last_reviewed_at: 2026-04-06
---

# 目标

## True North

让任意新项目在初始化后，任意 AI agent 只读 AGENTS.md 就能安全迭代，不需要额外的文档翻译层或上下文拼装。

## Hard Constraints

- 所有规则必须只有唯一归宿，不允许平行状态源
- Git 文件是规范与版本真相的唯一来源
- 不引入数据库、多租户或重型同步层
- 新增结构必须解释如何创造复利（跨项目复用）
- 默认采用 proposal-preview-confirm-apply 工作流
- 所有报告必须说明结论适用边界（本地证据 vs 运行态证据）

## This Phase Success（当前阶段验收标志）

- **派生产物语义统一**：`code_index/*`、`output/*`、`agent-coordination/*`、`.compounding-runtime/*` 统一为"主源 / 派生物"两层心智，不再各叫一套名字
- **单一状态机落地**：release 状态机只有一套，task/runtime 不再各自维护兼容壳
- **feature context 收敛**：`feature-context` 在有 task / 无 task 两条路径输出结构一致，首页 / 任务页 / 发布页只读同一份项目状态摘要
- **bootstrap 可复用**：新项目 attach 到 bootstrap 的路径清晰，5 分钟内可完成最小可运行 shell

## Not Goal

- 不是重建一套发布系统或工单审批流
- 不是把 task 演化成重型工单系统
- 不是做多租户或真实 agent runtime orchestration
- 不是用一次大改替代批次推进与逐步验收

## How We Got Here（演进脉络，供 context 用）

- `t-058/059` 收正了 CLI 外壳与 release/task 状态语义
- `t-063` 收成 `pnpm preflight` 单一门禁
- `t-066` 收成 feature 合同与 feature-context 统一 packet
- `t-068` 收成 activity trace 与 retro hints 闭环
- `t-069` 收成 operator assets 与 bootstrap 统一
- `t-095/096/097` 收成治理控制面与守护矩阵
- 当前主线：`派生产物语义收口` → `release 单一状态机` → `bootstrap 可复用验证`
