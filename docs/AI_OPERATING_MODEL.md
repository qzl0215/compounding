---
title: AI_OPERATING_MODEL
update_mode: manual
status: active
last_reviewed_at: 2026-03-23
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

- 先按 `AGENTS.md` 的真相源地图进入对应主源。
- 再补当前 task、相关 `module.md`、`code_index/*`，必要时先跑 `python3 scripts/pre_mutation_check.py`。

## 行为原则

- 需求不清、边界不清、成功标准不清时，先留在 plan。
- AI 默认先做三步：扩选项 → 收决策 → 产出 task。
- 遇到 unfamiliar pattern / infra / runtime capability，先搜已有实现、主源与成熟解，再决定是否自建。
- `Boil the Lake` 只适用于小而边界清楚的 task；大而跨阶段的事项留在 plan。
- `scripts/ai/create-task.ts` 可直接接收 `boundary / doneWhen / outOfScope / constraints / testStrategy`，把已收口的决策写成 task 合同，而不是只写摘要。
- task 只承接可执行边界；companion 只保留机器执行上下文；release 只保留验收与运行事实。
- 用户可感知变化默认走 `dev` 验收；内部低风险改动可由 AI 自验收并直接闭环。

## 工作模式

- 业务链固定为：`需求提出 → 战略澄清 → 方案评审 → 工程执行 → 质量验收 → 发布复盘`
- 详细定义、输入输出与进入退出条件以 `docs/WORK_MODES.md` 为准，这里不重复展开。

## 最小脚本契约

- 规划链默认脚本：`scripts/ai/create-task.ts`
- 执行链默认脚本：`scripts/ai/build-context.ts`、`node --experimental-strip-types scripts/ai/validate-change-trace.ts`、`node --experimental-strip-types scripts/ai/validate-task-git-link.ts`
- 交付链默认脚本：`node --experimental-strip-types scripts/release/prepare-release.ts --ref HEAD --channel dev`、`node --experimental-strip-types scripts/release/accept-dev-release.ts`、`node --experimental-strip-types scripts/release/reject-dev-release.ts`、`node --experimental-strip-types scripts/release/rollback-release.ts`
- 这些脚本只承接最小契约，不替代 `docs/WORK_MODES.md`、`docs/DEV_WORKFLOW.md` 或任务边界。

## 上下文与记忆

- `code_index/module-index.md` 给模块入口。
- `code_index/dependency-map.md` 给依赖方向。
- `code_index/function-index.json` 给粗粒度函数索引。
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
