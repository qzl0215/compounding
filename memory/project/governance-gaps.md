---
title: GOVERNANCE_GAPS
update_mode: manual
status: active
last_reviewed_at: 2026-04-07
source_of_truth: memory/project/governance-gaps.md
related_docs:
  - AGENTS.md
  - memory/project/operating-blueprint.md
  - memory/project/roadmap.md
  - memory/project/current-state.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 治理 Gap Backlog

这份 backlog 只承接治理控制面的 gap，不覆盖业务模块 gap。它是治理 gap 的唯一长期记录，不进入默认第一跳。

## GOV-GAP-01 task 仍未显式绑定治理 gap

- gap_id: `GOV-GAP-01`
- title: `task` 仍未显式绑定治理 gap
- from_assertion: `A4`
- current_symptom: task 合同已收口边界，但没有统一 `linked_gap` 字段，施工来源仍依赖 plan/task 文字理解。
- impact: task 容易直接承接“感觉上的问题”，而不是承接显式差距。
- should_be: task 必须引用矩阵产出的 gap 记录或其后续主 backlog 记录。
- status: `open`
- evidence:
  - `memory/project/operating-blueprint.md`
  - `tasks/queue/*.md`
  - `scripts/ai/lib/task-template.js`
- linked_tasks:
  - `task-094`
- notes: `t-094` 正在接通 task 合同字段、创建入口、校验链和 backlog 反向引用。

## GOV-GAP-02 状态主源已存在，但 task prose 仍保留派生状态位

- gap_id: `GOV-GAP-02`
- title: 状态主源已存在，但 `task prose` 仍保留派生状态位
- from_assertion: `A5`
- current_symptom: `kernel/task-state-machine.yaml` 已是状态契约主源，task 文档仍保留 `状态` / `当前模式` 兼容区块。
- impact: 人和 AI 容易把 prose 状态当成真实状态源，重新长出兼容壳。
- should_be: 状态只由状态契约和 companion 驱动，task 正文只保留必要派生展示或进一步收薄。
- status: `open`
- evidence:
  - `AGENTS.md`
  - `kernel/task-state-machine.yaml`
  - `tasks/queue/*.md`
- linked_tasks: []
- notes: 这是状态真相收口问题，不在本轮连带处理。

## GOV-GAP-03 assertion 到 gap 的稳定生成层刚建立，仍待固化

- gap_id: `GOV-GAP-03`
- title: assertion 到 gap 的稳定生成层仍待固化
- from_assertion: `A6`
- current_symptom: 断言矩阵已经能生成治理 gap，但生成规则与长期 backlog 的关系还是首版，尚未接到后续 task 合法来源链。
- impact: 如果 backlog 关系不固定，gap 仍可能重新退回 plan prose、task prose 或候选报告。
- should_be: gap 必须稳定由断言矩阵生成，并以 backlog 主记录作为唯一长期对象层。
- status: `open`
- evidence:
  - `memory/project/operating-blueprint.md`
  - `memory/project/governance-gaps.md`
- linked_tasks: []
- notes: 本轮先把 `Gap` 从矩阵候选升级为长期 backlog 对象，下一轮再接 task 绑定。

## GOV-GAP-04 truth 回写要求存在，但缺少固定归口规则

- gap_id: `GOV-GAP-04`
- title: truth 回写要求存在，但缺少固定归口规则
- from_assertion: `A7`
- current_symptom: 主干文档已要求同步回写，但还没有一层显式规则告诉改动后应回写 `Current` 还是其他受控事实入口。
- impact: 改动完成后容易留下“行为已变、真相未回写”的漂移。
- should_be: 行为变化必须按类型回写 `Current` 或受控事实入口，临时交付记录不能替代 truth。
- status: `closed`
- evidence:
  - `AGENTS.md`
  - `memory/project/current-state.md`
  - `docs/ASSET_MAINTENANCE.md`
- linked_tasks:
  - `task-095`
- notes: `t-095` 已在治理控制面补上 `writeback_targets` 归口矩阵、`validate-task-git` 文件级兑现校验与主源回写规则；业务模块推广与 assertion -> guard 映射仍留给后续轮次。

## GOV-GAP-05 治理断言尚未映射到验证与测试守护

- gap_id: `GOV-GAP-05`
- title: 治理断言尚未映射到验证与测试守护
- from_assertion: `A9`
- current_symptom: 测试矩阵和门禁存在，但没有覆盖“哪条治理断言由哪类验证保护”。
- impact: 治理规则容易退化成只靠人工记忆的约定。
- should_be: 每条活跃治理断言都应至少映射到一种门禁、测试或校验入口。
- status: `closed`
- evidence:
  - `docs/TEST_MATRIX.md`
  - `memory/project/current-state.md`
  - `package.json`
- linked_tasks:
  - `task-096`
- notes: `t-096` 已在 `memory/project/operating-blueprint.md` 内补上治理守护矩阵 v1，并新增 `ai:validate-governance-guards` 探针；v1 范围只覆盖 `A4 / A6 / A7 / A9`，`A5` 仍留在 `GOV-GAP-02` 的状态真相收口轮次。

## GOV-GAP-06 派生产物语义仍分散在多处脚本和文档

- gap_id: `GOV-GAP-06`
- title: `派生产物语义仍分散在多处脚本和文档`
- from_assertion: `A11`
- current_symptom: `code_index`、`output`、`agent-coordination` 和 `.compounding-runtime` 的 truth role、可写性与回灌边界仍分散在脚本和文档里，尚没有单一机器合同。
- impact: 过滤、校验和回写规则会在不同入口重复实现，增加误判主源和重复解释层的风险。
- should_be: 所有派生产物家族由 `kernel/derived-asset-contract.yaml` 统一定义 truth role、allowed readers、writeback boundary 与 ignore-as-truth。
- status: `open`
- evidence:
  - `memory/project/operating-blueprint.md`
  - `scripts/ai/lib/change-policy.ts`
  - `scripts/coord/scan.ts`
  - `scripts/ai/generate-code-volume.ts`
  - `shared/derived-asset-contract.ts`
- linked_tasks:
  - `task-098`
  - `t-098`
- notes: `t-098` 正在把单一机器合同、共享解析器和消费端接入收口到同一套语义。

## GOV-GAP-07 release 状态语义分散导致写链和读链分叉

- gap_id: `GOV-GAP-07`
- title: `release 状态语义分散导致写链和读链分叉`
- from_assertion: `A12`
- current_symptom: 当前 release 语义由 `status`、`acceptance_status`、`active_release_id`、`pending_dev_release_id` 和 runtime 观测拼接，写链和读链已经开始分叉。
- impact: release registry、Studio 和 harness 对 release 当前状态的判断不一致，导致状态展示和实际操作出现偏差。
- should_be: `kernel/release-state-machine.yaml` + `shared/release-state-machine.ts` 成为唯一 release 状态真相；`shared/release-registry.ts` 只做投影/修复；`scripts/release/*`、Studio、harness 与 project judgement 统一读 `state_id` / `state_label`。
- status: `open`
- evidence:
  - `scripts/release/prepare-release.ts`
  - `scripts/release/accept-dev-release.ts`
  - `scripts/release/reject-dev-release.ts`
  - `shared/release-registry.ts`
  - `apps/studio/src/modules/releases/registry.ts`
- linked_tasks:
  - `task-099`
  - `t-099`
  - `task-099-release-single-state-machine-convergence`
- notes: `t-099` 已完成 release 单一状态机与 registry 投影收口。

<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
