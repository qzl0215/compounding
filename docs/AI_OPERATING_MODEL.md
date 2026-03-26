---
title: AI_OPERATING_MODEL
update_mode: manual
status: active
last_reviewed_at: 2026-03-26
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/WORK_MODES.md
  - docs/DEV_WORKFLOW.md
  - memory/experience/README.md
  - code_index/module-index.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# AI 工作模型

## 最小起步顺序

- 先按 `AGENTS.md` 的默认读链进入对应主源。
- 再补当前 task、相关 `module.md`、`code_index/*`，必要时先跑 `pnpm preflight`；若已进入 `structural / release` task，则跑 `pnpm preflight -- --taskId=t-xxx`。

## 行为原则

- 需求不清、边界不清、成功标准不清时，先留在 plan。
- AI 默认先做三步：扩选项 → 收决策 → 产出 task。
- 遇到 unfamiliar pattern / infra / runtime capability，先搜已有实现、主源与成熟解，再决定是否自建。
- `Boil the Lake` 只适用于小而边界清楚的 task；大而跨阶段的事项留在 plan。
- 当需要找低风险熵减机会时，优先运行 `pnpm ai:cleanup-candidates` 读取瞬时候选，而不是先扩新 backlog 或新状态源。
- 当已绑定 `structural / release` task 时，先看 `pnpm preflight -- --taskId=t-xxx` 输出里的 `retro_hints`；默认先继承上一轮的耗时/阻塞结论，再决定是否继续试新路径。
- `scripts/ai/create-task.ts` 可直接接收 `boundary / doneWhen / outOfScope / constraints / testStrategy`，把已收口的决策写成 task 合同，而不是只写摘要。
- 新建 task 时，摘要本身就是人类标题，必须使用中文直给概述；`task-xxx` / `t-xxx` 只作索引，不代替标题。
- task 只承接可执行边界；companion 只保留机器执行上下文；release 只保留验收与运行事实。
- 只把价值判断、体验取舍、结果验收和高风险不可逆动作抛给人；实现级细节默认不向人要确认。
- 业务链与进入退出条件以 `docs/WORK_MODES.md` 为准，这里只保留 AI 应如何处理问题，不重复展开模式定义。

## 交互契约

- 交付 `dev` 或 production 页面时，默认同时提供环境说明、页面链接和如何验收。
- 任务在对话中默认使用“中文直给概述 + `t-xxx`”表达，不复述英文 task id。
- 用户可感知变化默认走 `dev` 验收；内部低风险改动可由 AI 自验收并直接闭环。

## 最小脚本契约

- 规划链默认脚本：`scripts/ai/create-task.ts`
- 执行链默认脚本：`scripts/ai/build-context.ts`、`node --experimental-strip-types scripts/ai/validate-change-trace.ts`、`node --experimental-strip-types scripts/ai/validate-task-git-link.ts`、`node --experimental-strip-types scripts/ai/validate-knowledge-assets.ts`
- 交付链默认脚本：`node --experimental-strip-types scripts/release/prepare-release.ts --ref HEAD --channel dev`、`node --experimental-strip-types scripts/release/accept-dev-release.ts`、`node --experimental-strip-types scripts/release/reject-dev-release.ts`、`node --experimental-strip-types scripts/release/rollback-release.ts`
- 熵减候选默认脚本：`node --experimental-strip-types scripts/ai/cleanup-candidates.ts`，只在计划评审、release 复盘或当前没有更高优先级产品任务时运行。
- 复盘候选默认脚本：`node --experimental-strip-types scripts/ai/retro-candidates.ts`，只读取 companion digest 聚合重复 blocker，不回写长期经验主源。
- 这些脚本只承接最小契约，不替代 `docs/WORK_MODES.md`、`docs/DEV_WORKFLOW.md` 或任务边界。

## 上下文与记忆

- `code_index/module-index.md` 给模块入口。
- `code_index/dependency-map.md` 给依赖方向。
- `code_index/function-index.json` 给粗粒度函数索引。
- `output/agent_session/task-activity/*` 是 24 小时 TTL 的临时轨迹，不是主源；长期只保留 companion 里的 `iteration_digest` 和 `output/ai/retro-candidates/*` 候选。
- 新经验先进入 `memory/experience/*`，稳定后再升格到 `docs/*` 或 `AGENTS.md`。
- 当前项目状态、roadmap 和 operating blueprint 在 `memory/project/*`。

## 验证与测试

- 默认验证顺序是：静态门禁 → 构建门禁 → 运行时门禁 → AI 输出门禁。
- `pnpm validate:static:strict` 只用于继续清理显性技术债，不默认把存量债务升级成每次发布的硬阻断项。
- test 采用风险驱动最小集：只保留能抓关键错误、且当前还在保护活跃行为的测试。

## 生产规则

- 生产发布只认 `main`；`dev` 只是 preview channel。
- 每轮可验收改动默认先生成 `dev` 预览；验收通过后再晋升到 `main` 和本地生产。
- release 是验收与回滚边界，不是 task 正文的第二份副本。
- 本地生产默认端口是 `3010`，预览默认端口是 `3011`。
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
