# 任务 task-039-truth-source-and-autonomy-subtraction

## 短编号

t-039

## 目标

收口影子真相源、退役冗余 AI helper 栈并把 gate/companion 改成减法自治模型


## 为什么

当前仓库仍存在生成器硬编码 live 治理文档、半失联 mode/preamble helper、对所有改动一刀切的 task 强门禁，以及 companion 顶层镜像扩张，这些问题持续限制 AI 自主能力并放大维护成本。


## 范围

- 收口 bootstrap/scaffold 对 live 治理文档的影子正文实现，改回模板/拷贝模式
- 删除未接入主链的 collaboration-mode / task-mode / unified-preamble helper 栈及其引用
- 为 change trace、task git gate 与 pre-task 引入 `light / structural / release` 分级策略
- 收口 task companion 写入模型，保留兼容读并减少顶层镜像字段扩散
- 缩减 `build-context` 默认载荷，并补齐 `apps/studio/src/modules/delivery/module.md`

## 范围外

- 不引入新的中心化 schema、数据库或额外持久化状态仓库
- 不重做 release registry、Studio 发布页或 task 页整体架构
- 不做历史 companion / task 台账的批量迁移
- 不在本轮一次性拆完所有超软上限文件

## 约束

- Markdown 继续作为 live 主源，不新增新的治理主源
- 轻量文档维护不得再被一刀切强制 full task ceremony
- release registry 继续是发布唯一主状态，companion 只能是派生合同
- 兼容读必须保留，新增写入统一收口到 canonical companion 结构

## 关联模块

- `scripts/compounding_bootstrap/*`
- `scripts/ai/build-context.ts`
- `scripts/ai/validate-change-trace.ts`
- `scripts/ai/validate-task-git-link.ts`
- `scripts/coord/check.ts`
- `scripts/coord/lib/task-meta.ts`
- `scripts/coord/lib/companion-lifecycle.ts`
- `scripts/coord/task.ts`
- `scripts/release/*`
- `apps/studio/src/modules/tasks/*`
- `apps/studio/src/modules/delivery/*`
- `docs/AI_OPERATING_MODEL.md`
- `docs/DEV_WORKFLOW.md`
- `docs/ASSET_MAINTENANCE.md`

## 当前模式

工程执行


## 分支

`codex/task-039-truth-source-and-autonomy-subtraction`


## 最近提交

`auto: branch HEAD`

## 交付收益

消除 live 文档与生成器漂移、降低 AI 被规则噪声拖慢的概率，并把 task / companion / release 的边界收口得更清晰。


## 交付风险

若 bootstrap / audit / tests 没同步更新，删掉影子实现后会直接暴露旧假设；若 gate 分级过宽，可能误放过结构性改动。


## 一句复盘

未复盘


## 主发布版本

未生成


## 关联发布版本

无


## 计划

1. 收口 bootstrap/scaffold：移除 live 治理文档的 renderer 正文实现，改成 canonical file copy，并补充唯一 `source_of_truth` 校验。
2. 退役 mode/preamble helper 栈，删除代码、引用和相关测试/manifest 依赖。
3. 为 change trace、task git gate 与 pre-task 引入 `light / structural / release` 分级，并收口 companion 写入模型。
4. 缩减 `build-context` 默认载荷，补齐 delivery module 文档并拆分第一批高熵大文件。
5. 跑静态、构建与 targeted tests，回写任务与必要文档。

## 发布说明

本任务主要是治理与执行链收口，不新增业务功能；风险集中在 bootstrap、gate 和 release 配套脚本的兼容性。

## 验收标准

- scaffold 不再通过 Python renderers 重写 live 治理文档正文
- 仓库内不再保留 collaboration-mode / task-mode / unified-preamble helper 栈及其 live 引用
- `validate-change-trace` 能区分 `light / structural / release`，且 `light` 无 task 时不硬失败
- companion 新写入收口到 canonical 结构，旧 JSON 仍可读取
- `build-context` 默认不再总是包含 workflow / AI model / project memory 文档
- `pnpm ai:scan-health` 至少消除 `delivery/module.md` 缺失，并减少超软上限文件数
- 相关测试、`pnpm lint`、`pnpm test`、`pnpm build`、`pnpm bootstrap:audit` 通过

## 风险

- bootstrap baseline 若仍依赖旧正文模板，scaffold idempotency 或 audit 可能回归
- gate 分级若路径集合定义不严，会出现轻量改动误判或结构改动漏拦
- companion 兼容写收口时若有漏改，Studio 或 release handoff 可能读不到预期字段

## 状态

doing

## 更新痕迹

- 记忆：`no change: task created only`
- 索引：`code_index/module-index.md, code_index/function-index.json`
- 路线图：`no change: current priority unchanged`
- 文档：`AGENTS.md, docs/AI_OPERATING_MODEL.md, docs/ARCHITECTURE.md, docs/ASSET_MAINTENANCE.md, docs/DEV_WORKFLOW.md, tasks/queue/task-039-truth-source-and-autonomy-subtraction.md`

## 复盘
