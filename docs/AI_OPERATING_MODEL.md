---
title: AI_OPERATING_MODEL
update_mode: manual
status: active
last_reviewed_at: 2026-03-29
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
- 再读 `kernel/task-state-machine.yaml` 判断当前 `mode_id / state_id` 契约。
- 最后按 mode 补当前 task、相关 `module.md`、`code_index/*`；若已进入 `structural / release` task，则跑 `pnpm preflight -- --taskId=t-xxx`。

## 行为原则

- 需求不清、边界不清、成功标准不清时，先留在 plan。
- AI 默认先做三步：扩选项 → 收决策 → 产出 task。
- 若工具面已安装 Superpowers，只在需求未收口、存在多方案取舍或多步 `structural / release` 事项时触发 `brainstorming` / `writing-plans`；默认不为 `light` 改动生成第二套 spec / plan 资产。
- 遇到 unfamiliar pattern / infra / runtime capability，先搜已有实现、主源与成熟解，再决定是否自建。
- 涉及服务器访问、GitHub 接入方式或标准发布动作时，先读 `bootstrap/project_operator.yaml`；需要扫读版时读 `docs/OPERATOR_RUNBOOK.md`。
- `Boil the Lake` 只适用于小而边界清楚的 task；大而跨阶段的事项留在 plan。
- 当需要找低风险熵减机会时，优先运行 `pnpm ai:cleanup-candidates` 读取瞬时候选，而不是先扩新 backlog 或新状态源。
- 当已绑定 `structural / release` task 时，先看 `pnpm preflight -- --taskId=t-xxx` 输出里的 `retro_hints`；默认先继承上一轮的耗时/阻塞结论，再决定是否继续试新路径。
- `scripts/ai/create-task.ts` 可直接接收 `boundary / doneWhen / outOfScope / constraints / testStrategy`，把已收口的决策写成 task 合同，而不是只写摘要。
- 新建 task 时，摘要本身就是人类标题，必须使用中文直给概述；`task-xxx` / `t-xxx` 只作索引，不代替标题。
- task 只承接可执行边界；companion 只保留机器执行上下文；release 只保留验收与运行事实。
- 只把价值判断、体验取舍、结果验收和高风险不可逆动作抛给人；实现级细节默认不向人要确认。
- AI 装配上下文时只看当前 `mode_id`，不再按“战略澄清 / 方案评审 / 工程执行 / 质量验收 / 发布复盘”人工场景猜测。

## Superpowers 映射

- 本仓把 Superpowers 当单向增强层，不接受它反向创建第二套主源或第二套状态流。

| 场景 | 默认启用 | 条件启用 | 默认抑制 |
| --- | --- | --- | --- |
| `light` | `verification-before-completion`、`receiving-code-review`、`requesting-code-review` | 无 | `brainstorming`、`writing-plans`、`using-git-worktrees`、`test-driven-development` |
| `structural` | `verification-before-completion`、`receiving-code-review`、`requesting-code-review` | 先 task 合同；需求或设计未收口时再启 `brainstorming`，多步执行才启 `writing-plans`，只有能拆成 2 个以上独立子块时才启 `subagent-driven-development` | 上游 spec 落盘、上游 plan 落盘、每个微步骤强制 commit、blanket TDD |
| `release` | `verification-before-completion`、`receiving-code-review` | 可把 `requesting-code-review` 当辅助检查单 | 任何替代 `coord:review:run`、`release:*` 的技能流 |

- 工件映射固定如下：
  - 上游 spec → `memory/project/operating-blueprint.md` 收口或 task 边界收口
  - 上游 implementation plan → 本仓 task 合同与 handoff
  - 上游 review 流程 → `pnpm coord:review:run -- --taskId=t-xxx`
  - 上游 completion verification → 本仓验证门禁
- 明确禁止在本仓新增 `docs/superpowers/specs/*` 与 `docs/superpowers/plans/*` 作为长期主源。
- `using-git-worktrees` 只在当前 worktree 不干净或确实需要并行隔离时启用；标准目录固定为项目内 `.worktrees/`，初始化与验证统一使用 `pnpm install`、`pnpm preflight` 与本仓验证命令，不用 `npm install` / `npm test` 假设。
- `test-driven-development` 只对真正的功能/行为变更按需启用；文档、配置、任务合同、资产生成和工具映射调整继续沿用风险驱动最小测试集。
- `execution`：只有 task 已 `ready` 且 `pnpm preflight -- --taskId=t-xxx` 通过后，才把 `subagent-driven-development` 作为增强层；若技能建议与本仓 task / branch / worktree / preflight / handoff / review / release 链冲突，以仓库协议优先。
- `review / release`：`receiving-code-review`、`requesting-code-review`、`verification-before-completion` 只做检查单；状态迁移、评审结论和交付动作仍只认 `coord:review:run` 与 `release:*` 命令。
- Codex 本机若已安装 `~/.codex/skills/compounding-operating-profile/SKILL.md`，先按该 overlay 把本仓主链翻译成 skill 触发策略；overlay 不能替代 `AGENTS.md` 与本文件。
- 本机默认推理强度建议是 `high`；只有设计收口、复杂 review 或架构决策才显式升到 `xhigh`。
- 新会话进入本仓时，默认先读仓库主链，再跑 `pnpm ai:doctor:superpowers`；若属于 `structural / release`，先 task，再跑 `pnpm preflight -- --taskId=t-xxx`。
- 每次升级上游 Superpowers 后，都要重新跑 doctor，并记录 doctor 暴露的 upstream SHA，避免技能更新导致行为漂移而仓库无感知。

## Mode Context Assembly

- `planning`
  输入：task 合同草案、`roadmap`、`operating-blueprint`、`current-state`、必要模块上下文。
  输出：边界、完成定义、范围外、约束、测试策略、`delivery_track`。
- `execution`
  输入：已收口 task 合同、`current-state`、相关模块/索引、retro hints、search evidence。
  输出：实现改动、handoff、最小验证结果、必要 search evidence。
- `review`
  输入：task 合同、diff summary、scope/architecture/test 结果。
  输出：merge decision、review note、是否进入 release。
- `release`
  输入：通过 review 的结果、`delivery_track`、operator/runtime/release facts。
  输出：preview、accept/reject、prod promote、rollback 结果。

## 交互契约

- 交付 `dev` 或 production 页面时，默认同时提供环境说明、页面链接和如何验收。
- 任务在对话中默认使用“中文直给概述 + `t-xxx`”表达，不复述英文 task id。
- 用户可感知变化默认走 `dev` 验收；内部低风险改动可由 AI 自验收并直接闭环。

## 最小脚本契约

- 规划链默认脚本：`scripts/ai/create-task.ts`、`pnpm coord:task:start -- --taskId=t-xxx`
- 执行链默认脚本：`scripts/ai/build-context.ts`、`pnpm preflight -- --taskId=t-xxx`、`pnpm coord:task:handoff -- --taskId=t-xxx`
- 评审链默认脚本：`pnpm coord:review:run -- --taskId=t-xxx`
- 交付链默认脚本：`node --experimental-strip-types scripts/release/prepare-release.ts --ref HEAD --channel dev`、`node --experimental-strip-types scripts/release/accept-dev-release.ts`、`node --experimental-strip-types scripts/release/reject-dev-release.ts`、`node --experimental-strip-types scripts/release/rollback-release.ts`
- Superpowers 显式校验命令：`pnpm ai:doctor:superpowers`
- override 状态入口：`pnpm coord:task:transition -- --taskId=t-xxx --event=<event> --reason="..."`
- 运维接入主合同：`bootstrap/project_operator.yaml`；跨工具薄入口只负责把不同工具跳回这份合同与 `AGENTS.md`
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
