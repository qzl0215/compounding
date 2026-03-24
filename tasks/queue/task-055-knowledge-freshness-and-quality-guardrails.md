# 任务 task-055-knowledge-freshness-and-quality-guardrails

## 任务摘要

- 短编号：`t-055`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把高频主干文档和专项附录升级为可被静态门禁识别的新鲜主源
- 为什么现在：
  当前仓库已经把 docs/memory 定义成主源，但 freshness 仍停留在口头约束；需要把文档主源变成可校验契约，避免知识资产 silently drift。
- 承接边界：
  只扩现有 knowledge asset registry 与静态校验链，不新增页面、数据库、长期质量台账或第二套知识系统。
- 完成定义：
  `pnpm ai:validate-assets` 能输出瞬时 `quality_grade` 与 freshness 结论；`pnpm validate:static:strict` 会对高频主干文档 stale 状态升级为硬失败。

## 执行合同

### 要做

- 为手工维护的知识资产增加 freshness policy。
- 扩展 `validate-knowledge-assets` 输出 `quality_grade`、stale warnings、frontmatter / `related_docs` / `source_of_truth` 校验。
- 让“文档已变更但未更新 `last_reviewed_at`”成为 hygiene error。
- 补对应自动化测试与生成资产同步。

### 不做

- 不新增知识库页面。
- 不持久化质量分数。
- 不引入后台 agent 或第二套知识系统。

### 约束

- 继续复用 `pnpm ai:validate-assets` 与 `pnpm validate:static` 入口。
- 结果只存在于 CLI/report 输出，不落成新的 repo-tracked 真相源。
- 高频主干文档 stale 默认只在 strict 模式升级为硬失败。

### 关键风险

- 若 freshness 规则过重，会把文档维护重新做成 paperwork。
- 若 `related_docs` / frontmatter 校验不稳，会制造噪音误报。

### 测试策略

- 为什么测：这条主线直接改变知识资产门禁契约，必须锁住 freshness、strictness 与 hygiene 行为。
- 测什么：knowledge asset registry、`validate-knowledge-assets` 返回契约、strict/non-strict stale 判定、frontmatter / `related_docs` 断链与更新时间戳规则。
- 不测什么：不做页面回归，也不新增长期质量台账测试。
- 当前最小集理由：只覆盖会改变门禁结论的高价值场景，避免为文档治理再造重测试层。

## 交付结果

- 状态：done
- 体验验收结果：
  `pnpm ai:validate-assets` 现在会输出瞬时 `quality_grade`、freshness 结论、frontmatter / `related_docs` hygiene 结果；`pnpm validate:static:strict` 会把高频主干文档 stale 状态升级为硬失败。
- 交付结果：
  knowledge asset registry 已补 freshness policy 与 metadata policy；手工维护文档现在会校验 frontmatter、`related_docs`、`source_of_truth` 和 `last_reviewed_at` 变更；知识质量结论只停留在 CLI/report 输出，不会形成新的 repo-tracked 状态源。
- 复盘：
  真正值钱的不是再造质量面板，而是把“文档是主源”压成可执行的 hygiene 契约，并把 stale state 只提升到足够有用、不制造 paperwork 的强度。

## 当前模式

工程执行

## 分支

`main`

## 关联模块

- `scripts/ai/`
- `docs/`
- `memory/project/`

## 更新痕迹

- 记忆：`memory/project/operating-blueprint.md`, `memory/project/roadmap.md`, `memory/project/current-state.md`
- 索引：`no change: no generated code_index change required`
- 路线图：`memory/project/roadmap.md`
- 文档：`docs/AI_OPERATING_MODEL.md`, `docs/DEV_WORKFLOW.md`, `docs/ASSET_MAINTENANCE.md`, `tasks/queue/task-055-knowledge-freshness-and-quality-guardrails.md`
