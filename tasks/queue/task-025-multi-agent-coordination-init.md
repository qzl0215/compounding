# 任务 task-025-multi-agent-coordination-init

## 短编号

t-025

## 目标

初始化 Autonomous Multi-Agent Coordination Layer，落地 agent-coordination 目录骨架、manifest 扫描器、lock registry、pre-task check、scope guard、review 骨架与 decision card 生成器，为多 Agent 并行协作提供最小闭环。

## 为什么

当前仓库已有 task 绑定、分层门禁、release registry，但缺少支撑多 Agent 并行的核心能力：风险地图、任务级文件锁、范围守卫、可组合 auto-review、decision card。若不初始化该层，多 Agent 并行时易互相覆盖、污染主干。

## 范围

- 落地 `agent-coordination/` 目录骨架（manifest/tasks/locks/policies/reports/decisions）
- 实现 `scripts/coord/scan.ts`：按 hard rule + heuristic 生成 manifest.json 与初版风险报告
- 实现 `scripts/coord/lock.ts`：acquire/release/status，持久化到 lock-registry.json
- 实现 `scripts/coord/check.ts`：pre-task check（preflight + lock check + task companion 创建）
- 实现 `scripts/coord/scope-guard.ts`：比较 planned_files vs actual git diff，输出 JSON
- 实现 `scripts/coord/review.ts`：scope/lock/test reviewer 骨架，JSON 聚合输出
- 实现 `scripts/coord/decision.ts`：decision card 生成器
- 在 package.json 注册所有 coord:* 命令入口
- 更新 roadmap / operating-blueprint / current-state / AGENTS 当前主线

## 范围外

- 不实现完整 merge gate 与 auto-merge 决策
- 不接入 git hooks / CI（Phase 2）
- 不实现 UI 验收产物生成与差异摘要（Phase 3）

## 约束

- 继续坚持 `AGENTS.md` 为唯一高频主源
- 增量接入，不覆盖现有 `scripts/ai/` 和 `tasks/queue/` Markdown
- 不引入平行规则体系，coordination 层作为现有系统的扩展

## 关联模块

- `AGENTS.md`
- `memory/project/roadmap.md`
- `memory/project/operating-blueprint.md`
- `memory/project/current-state.md`
- `agent-coordination/`
- `scripts/coord/`
- `package.json`
- `tasks/queue/task-025-multi-agent-coordination-init.md`
- `tasks/queue/task-026-coord-auto-review-enhance.md`
- `tasks/queue/task-027-coord-unattended-polish.md`

## 当前模式

工程执行

## 分支

`codex/task-025-multi-agent-coordination-init`

## 最近提交

`auto: branch HEAD`

## 交付收益

多 Agent 可安全并行协作、任务边界可见、文件风险可追踪、锁状态机器可读、范围越界可阻断、高风险决策可收敛为可读决策卡片。

## 交付风险

若 manifest 过于保守，会过多识别高风险文件；若 lock 粒度过细，会增加协调开销。第一版宁可保守。

## 计划

1. 注册本任务并更新 roadmap / operating-blueprint / current-state / AGENTS
2. 落地 agent-coordination 目录骨架、risk-rules.json、overrides.json、policies 等 JSON schema
3. 实现 scan.ts：扫描仓库、生成 manifest.json、输出风险报告
4. 实现 lock.ts：acquire/release/status，持久化 lock-registry.json
5. 实现 check.ts：pre-task check（preflight + lock + task companion）
6. 实现 scope-guard.ts：planned_files vs git diff 比较
7. 实现 review.ts：scope/lock/test reviewer 骨架
8. 实现 decision.ts：decision card 生成器
9. 在 package.json 注册 coord:* 命令
10. 注册 t-026、t-027 子任务骨架

## 发布说明

本任务交付 Multi-Agent Coordination Layer 的 Phase 0+1 最小闭环，为后续 Phase 2 自动化增强与 Phase 3 无人值守完善奠定基础。

## 验收标准

- 运行 `pnpm coord:manifest:rebuild` 可生成 manifest.json 与风险报告
- 运行 `pnpm coord:lock:acquire` / `pnpm coord:lock:release` 可更新 lock-registry.json
- 运行 `pnpm coord:check:pre-task` 可执行 pre-task check（含 preflight / lock / task companion）
- 运行 `pnpm coord:check:scope` 可比较 planned_files vs actual diff）
- 运行 `pnpm coord:review:run` 可输出 JSON 聚合 reviewer 结果
- 运行 `pnpm coord:decision:build` 可生成 decision card JSON
- 所有 coord:* 命令均在 package.json 中注册

## 风险

- 扫描器 heuristic 可能误判部分文件风险等级 → 支持 overrides.json 人工降级
- lock 与 task companion 需与 tasks/queue/*.md 保持同步 → 文档约定为主源

## 状态

doing

## 更新痕迹

- 记忆：`memory/project/roadmap.md`, `memory/project/operating-blueprint.md`, `memory/project/current-state.md`
- 索引：`agent-coordination/`, `scripts/coord/`, `code_index/module-index.md`
- 路线图：`memory/project/roadmap.md`
- 文档：`AGENTS.md`, `package.json`, `tasks/queue/task-025-multi-agent-coordination-init.md`, `tasks/queue/task-026-coord-auto-review-enhance.md`, `tasks/queue/task-027-coord-unattended-polish.md`

## 一句复盘

完成 Multi-Agent Coordination Layer Phase 0+1 初始化：manifest 扫描、lock registry、pre-task check、scope guard、review 骨架、decision card 生成器及 coord:* 命令均已落地并验证通过。
