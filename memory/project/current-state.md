---
title: CURRENT_STATE
doc_role: memory
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-20
source_of_truth: memory/project/current-state.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/operating-blueprint.md
  - tasks/queue/task-025-multi-agent-coordination-init.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 当前状态

## 项目概览

- 项目名称：Compounding AI Operating System
- 战略真相请看 `memory/project/roadmap.md`
- 这里仅记录当前运营快照、冻结项和运行边界

## 使命与愿景

- 使命：把当前仓库升级成适合 AI 长期协作、任务驱动、可持续重构与自进化的 AI-Native Repo。
- 愿景：让这个项目既像创业团队一样高效推进，又能把经验、结构和发布能力持续沉淀成复利系统。

## 核心价值观

- 规则服务于效率，不服务于扩张
- 持续抓重点，不过度优化
- 少条条框框，但井井有条

## 本地入口

- 本地生产默认端口：`3010`
- dev 预览默认端口：`3011`
- `main` 已更新不等于本地生产自动在线；需要手动拉起本地常驻进程

## 运行边界

- server-only

## 当前焦点

- [x] 完成 gstack 七项实践里程碑（t-019~t-024）
- [x] 落地 Multi-Agent Coordination Layer（t-025/t-026/t-027）
- [x] 推进真相源收口与交付快照统一（t-028）
- [x] 收口 `roadmap` 与 `current-state` 的职责边界，并继续收敛交付快照（t-029）
- [x] 完成 `t-030`：产出 `gstack -> Compounding` 对齐矩阵，并锁定下一阶段只吸收流程与门禁层高 ROI 能力
- [x] 推进 `t-031`：把规划链、执行链、交付链收口成清晰的工作模式入口与 runbook，并已发布到 main 与本地生产
- [x] 推进 `t-032`：差异感知 QA / Review / Retro 产物，并已发布到 main 与本地生产
- [x] 完成 `t-033`：补齐 pre-task 安全护栏，并已发布到 main 与本地生产
- [x] 完成 `t-034`：收口 task resolver、release cutover、roadmap frontmatter 与交付快照展示层，并已发布到 main 与本地生产
- [x] 完成 `t-035`：锁定 Delivery Framework 第一阶段边界，并把主线切到 `t-036`
- [ ] 启动 `t-036`：以任务伴随体与交付契约闭环作为下一条实现主线

## 当前推荐校验顺序

- 静态门禁：`pnpm validate:static`
- 构建门禁：`pnpm validate:build`
- 运行时门禁：
  - `pnpm preview:check`
  - `pnpm prod:check`
- AI 输出门禁：`pnpm validate:ai-output`（仅在 prompt / AI 重构链路变动时进入）
- 多 Agent 协调：`pnpm coord:check:pre-task`（在 task 变更前执行）

## 关键冻结项

- 不恢复旧 workflow 前台和重型多步骤表单
- 不把 task 演化成审批流或重型工单系统
- 不新增平行读模型或后台数据库
- 不以一次大改替代批次推进与逐步验收

## 下一检查点

- [x] 完成 `t-032` 的差异感知 QA / Review / Retro 产物
- [x] 完成 `t-033` 的预任务安全护栏补全
- [x] 完成 `t-034` 的高 ROI 收敛修复
- [x] 完成 `t-035`，把 Delivery Framework 第一阶段固定为“任务伴随体与交付契约闭环”
- [ ] 启动 `t-036`，仅实现 companion-driven delivery contract，不扩 orchestration UI、浏览器 daemon 或数据库
- [ ] 在 `t-036` 内优先打通 create / pre-task / handoff / review / release handoff 的 companion 生命周期
- 保持运营快照与战略真相分工清楚
- 保持 `pnpm validate:release` 持续绿色通过

## 证据边界

- 本地离线证据：`pnpm lint`、`pnpm test`、`pnpm build`、`scripts/ai/validate-change-trace.ts`、`scripts/ai/validate-task-git-link.ts`
- 服务器真实证据：本地生产 active release 以 `/releases` 页面与 release registry 为准
- 当前结论适用边界：`t-035` 已完成并且当前无 pending dev；下一条主线切到 `t-036`，目标是把任务伴随体升级成 companion-driven delivery contract 的最小闭环。规划依据同步沉淀在 `memory/experience/exp-006-delivery-framework-phase-one-boundary.md`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
