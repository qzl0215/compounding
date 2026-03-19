# 预任务安全护栏补全

## 短编号

t-033

## 目标

补齐任务开始前的安全护栏，让越界改动、高风险决策和运行态异常在动手前就暴露出来。

## 为什么

当前仓库已经有多 Agent 协作骨架和部分 pre-task 检查，但任务前安全链路还不够完整。若不先把 pre-task gate、scope guard 和高风险决策收口继续补齐，后续复杂任务仍会在提交后才暴露边界问题。

## 范围

- 强化 pre-task gate
- 补齐 scope guard
- 收口高风险决策卡片
- 把任务前运行/锁状态检查继续接到现有协调层

## 范围外

- 不引入浏览器 daemon
- 不引入 Bun 原生运行时
- 不引入 Claude 客户端绑定能力

## 约束

- 继续围绕现有 `agent-coordination/*` 与 `scripts/ai/*` 演进
- 任务前护栏要拦风险，不要变成新的重型审批流

## 关联模块

- `AGENTS.md`
- `docs/DEV_WORKFLOW.md`
- `agent-coordination/*`
- `scripts/ai/*`
- `scripts/coord/check.ts`
- `scripts/coord/lib/task-meta.ts`
- `docs/AI_OPERATING_MODEL.md`

## 当前模式

发布复盘

## 分支

`codex/task-033-pre-task-safety-guardrails`

## 最近提交

`d189713 docs: sync task-033 recent commit`

## 交付收益

把高风险任务的边界问题提前暴露，减少“做了一半才发现越界或冲突”的返工。

## 交付风险

如果 pre-task 护栏过重，会拖慢小任务启动；如果决策卡收口不清，仍会回到人工口头判断。

## 一句复盘

pre-task 已统一检查 worktree、runtime、scope、lock，并在高风险时产出 decision card。

## 主发布版本

`20260319153311-d189713-prod`

## 关联发布版本

`20260319152428-d189713-dev`

## 计划

1. 收口 pre-task gate 的输入和失败语义。
2. 强化 scope guard 和高风险决策卡。
3. 让任务前运行态与锁状态检查进入默认链路。

## 发布说明

本任务已通过 `dev` 预览验收，并已发布到 `main` 与本地生产。

## 验收标准

- pre-task 阶段能拦下明显越界或高风险任务
- 不依赖新的浏览器运行时或客户端绑定能力
- 高风险决策能收口成可读卡片

## 风险

- 护栏过度会拖慢小步快跑
- 护栏不足又无法真正降低高风险任务的不确定性

## 状态

done

## 更新痕迹

- 记忆：`memory/project/current-state.md, memory/project/operating-blueprint.md`
- 索引：`no change: current scope only`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-033-pre-task-safety-guardrails.md, memory/project/current-state.md, memory/project/roadmap.md, memory/project/operating-blueprint.md`

## 复盘

轻量 pre-task gate 先拦风险、再输出决策卡，比把风险留到提交后更稳，也没有把任务前检查做成审批流。
