# 记录耗时弯路并生成复盘候选

## 任务摘要

- 任务 ID：`task-068-retro-activity-digest`
- 短编号：`t-068`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  记录耗时弯路并生成复盘候选
- 为什么现在：
  下一个新 Agent 最需要快速知道时间耗在哪儿、弯路为何重复，以及有没有现成 shortcut；这轮先用轻量派生产物把这条链跑通。
- 承接边界：
  只改 coord/release 入口、companion 摘要、临时派生产物和高频文档，不改 Studio UI 或 experience 主源。
- 完成定义：
  structural/release task 会自动记录阶段耗时；24h 后 raw trace 会 compact 进 companion digest；重复 blocker 会生成 retro candidate；preflight/task:start 会带出 hints。

## 执行合同

### 要做

- 为 structural/release task 增加 24h TTL activity trace\n- 扩 companion artifacts，增加 iteration_digest\n- 生成 retro candidates 派生产物并接到 preflight 输出\n- 更新高频文档与测试

### 不做

- 不做命令级细日志\n- 不改 Studio 页面\n- 不自动升格到 memory/experience/*\n- 不覆盖 light 改动

### 约束

- raw trace 只保留 24 小时\n- 只记录阶段级 active/wait 时间\n- search 只记 note，不单独计时\n- 不新增数据库或长期第二状态源

### 关键风险

- companion schema 扩展要保持兼容\n- release/coord 入口分散，容易漏记阶段切换\n- cleanup 逻辑若不稳，可能误删或重复累计

### 测试策略

- 为什么测：这轮同时改 coord、release 和 companion 写回，必须验证事件采集、compact 和 CLI contract 都稳定。
- 测什么：- coord CLI task/basic preflight 输出\n- activity trace compact 与 digest 聚合\n- retro candidates 生成阈值与输出\n- release/review 入口不会破坏现有 contract
- 不测什么：- 不做 Studio UI 回归\n- 不做真实长时间 24h 端到端，只做时间注入测试
- 当前最小集理由：优先用脚本级测试覆盖多入口与 cleanup 逻辑，避免这轮引入长期噪音状态源。

## 交付结果

- 状态：in_progress
- 体验验收结果：
  
- 交付结果：
  
- 复盘：
  

## 当前模式

工程执行

## 分支

`codex/task-068-retro-activity-digest`

## 关联模块

- `scripts/coord/lib/`\n- `scripts/coord/preflight.ts`\n- `scripts/coord/task.ts`\n- `scripts/coord/review.ts`\n- `scripts/release/`\n- `agent-coordination/tasks/`\n- `output/agent_session/`\n- `output/ai/`

## 更新痕迹

- 记忆：pending: 完成后回写 current-state / roadmap / experience README
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：pending: 完成后更新 AGENTS / DEV_WORKFLOW / AI_OPERATING_MODEL
