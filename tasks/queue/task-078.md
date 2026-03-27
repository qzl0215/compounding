# 收口改动观察来源并降低门禁噪音

## 任务摘要

- 任务 ID：`task-078`
- 短编号：`t-078`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  收口改动观察来源并降低门禁噪音
- 为什么现在：
  Phase 2A 已把 `change_packet` 收成稳定主协议，但 `feature-context` 还保留内部 `git status` 读取；现在需要只做输入切换，让 selectedChecks 与 Phase 1/2A 使用同一套 worktree 观察口径。
- 承接边界：
  本轮只做 Phase 2B：把 `scripts/ai/lib/feature-context.ts` 内部直接读 `git status` 的路径切到 `buildChangePacket(root, { mode: "worktree" }).changed_files`；补 `feature-context` 的 clean/dirty/recent 回归测试；不改 selectedChecks 语义，不动 `diff-aware`、release/runtime/bootstrap，也不拆大文件。
- 完成定义：
  `feature-context` 不再直接读取 git 来决定 changed files；selectedChecks 只消费 `change_packet.changed_files`；clean tree 不再受 recent commit 污染；dirty `scripts/ai/*`、docs-only、runtime/build-sensitive 路径的检查结果保持原语义。

## 执行合同

### 要做

把 `scripts/ai/lib/feature-context.ts` 内部的 `collectSelectedChecks -> readChangedFiles -> git status --short` 路径切到 `buildChangePacket(root, { mode: "worktree" }).changed_files`；删除旧 git 读取函数；补一组 temp-repo 回归测试，覆盖 clean tree、recent structural committed、dirty `scripts/ai/*`、dirty docs-only、dirty runtime/build-sensitive 几类场景。

### 不做

- 不重构 summary-harness、feature-context、release、bootstrap、task contract 或 Studio 读模型。
- 不改变 `light / structural / release` 分类规则本身。
- 不降低真实 structural change 的 task binding 治理强度。
- 不把 `diff-aware` 强行迁成 Phase 1 的 `recent` 语义。
- 不新增更多顶层平铺变化字段。
- 不改 selectedChecks 的 heuristics、health score 或 summary/context 控制流。
- 本轮只做输入切换，不放松治理。

### 约束

保持 light / structural / release 三段分类和现有 task binding 强度不变；不新增状态源；`change_packet` 是唯一主协议；顶层旧字段只作为 alias，且必须由统一 helper 生成。

补充语义合同：
- `worktree mode` 的 truth source 只认当前 `git status --short` 的 repo-tracked 改动；明确不看 `HEAD^..HEAD` 或更早历史；只用于 preflight / scope guard 这类“现在能否开始改”的判断。
- `recent mode` 的 truth source 认“最近一次 repo-tracked 改动”，优先当前 worktree，worktree 干净时回退到 `HEAD^..HEAD`；明确不用于决定下一轮是否允许开工，只用于提交后校验仍需看到最近改动的场景。
- `shared/change-packet.ts` 只放类型合同与共享字面量类型；`scripts/ai/lib/change-policy.ts` 是唯一 builder 实现；`feature-context` 本轮只允许消费 `change_packet.changed_files`，不得在内部再形成第二套 change observation 逻辑。

### 关键风险

若 `feature-context` 输入切换扩散到 selectedChecks 规则、diff-aware 语义或 summary/context 控制流，这轮就会从窄环退化成重构；若 clean tree 仍被 recent commit 污染，则说明 worktree 语义没有真正接通。

### 测试策略

- 为什么测：Phase 2B 的目标是只切换 `feature-context` 输入源；必须证明 selectedChecks 的触发逻辑没漂移，同时 clean tree 不再受 recent commit 污染。
- 测什么：`tests/test_ai_feature_context.py` 的 temp-repo 回归场景，以及 `scripts/ai/feature-context.ts --surface=home --json` smoke。
- 不测什么：不新增 Studio e2e，不改 release/runtime 端到端，不动 diff-aware。
- 当前最小集理由：high

测试矩阵：
- clean tree：
  `required_checks` / `recommended_checks` 不受 recent commit 污染；在无模块合同推荐检查时，diff-aware 贡献为空。
- clean tree + recent structural committed：
  最近一次已提交的 `scripts/ai/*` 改动不会再让 clean tree 出现 `static / build / ai-output`。
- dirty `scripts/ai/*`：
  `required_checks` 仍包含 `静态门禁 / 构建门禁 / AI 输出门禁`。
- dirty docs-only：
  `required_checks` 仍只包含 `静态门禁`，不会新增 `build / runtime / ai-output`。
- dirty runtime/build-sensitive：
  `required_checks` 仍包含 `静态门禁 / 构建门禁`，`recommended_checks` 仍包含 `运行时检查`。

## 交付结果

- 状态：doing
- 体验验收结果：
  已验证 `feature-context` 的输入改为 `change_packet.changed_files` 后，clean tree 不再受 recent commit 污染；dirty `scripts/ai/*`、docs-only、runtime/build-sensitive 的 selectedChecks 仍保持原语义。
- 交付结果：
  已完成四步窄环：Phase 2A 把 `change_packet` 收成主协议；Phase 2B 让 `feature-context` 改读 `change_packet.changed_files`；Phase 3B/3C 进一步把 `diff-aware` 的 source 语义显式化为 `DiffSnapshot`，并把 `change-policy` / `diff-aware-source` 共享的 git 文件列表解析下沉到 `shared/git-changed-files.ts`；本轮 Phase 3D 再把 `feature-context` 对 `static/build/runtime/ai-output` 的 layer catalog 来源收口到 `apps/studio/src/modules/releases/validation.ts`，同时保留 feature 侧原有 commands 与 selectedChecks 触发逻辑不变。
- 复盘：
  本轮收益来自“共享稳定词表，而不硬并选择逻辑”：`feature-context` 和 `diff-aware` 继续保留各自的 selectedChecks 语义，但至少不再各自维护一套 layer identity/title；同时也避免把 release 侧更重的命令链直接带进 feature 开工包。

## 当前模式

工程执行

## 分支

`codex/task-078`

## 关联模块

- `shared/change-packet.ts`
- `shared/git-changed-files.ts`
- `scripts/ai/lib/change-policy.ts`
- `scripts/ai/lib/feature-context.ts`
- `apps/studio/src/modules/delivery/diff-snapshot.ts`
- `apps/studio/src/modules/delivery/diff-aware-source.ts`
- `scripts/coord/lib/preflight-gate.ts`
- `scripts/coord/scope-guard.ts`
- `scripts/ai/validate-change-trace.ts`
- `scripts/ai/validate-task-git-link.ts`
- `apps/studio/src/modules/delivery/__tests__/diff-aware-source.test.ts`
- `tests/test_ai_feature_context.py`
- `tests/test_coord_cli.py`
- `docs/DEV_WORKFLOW.md`

## 更新痕迹

- 记忆：no change: 未更新
- 索引：no change: 未更新
- 路线图：no change: 未更新
- 文档：updated `docs/DEV_WORKFLOW.md`
