# 任务 task-038-autonomy-entropy-reduction

## 短编号

t-038


## 目标

收口真相源、规则层与交付绑定中的结构性熵增点


## 为什么

当前仓库仍存在短编号歧义、战略/运营双写、规则重复、task-release 启发式绑定和首页残留占位状态，这些问题会持续限制 AI 自主能力并放大维护成本。


## 范围

- 收口 task 短编号的唯一性与解析规则，清除历史歧义
- 移除首页与 cockpit 中已废弃的占位状态、旧证据网格与位置耦合
- 收口 `roadmap / current-state / operating-blueprint` 的重复计划口径
- 压缩 live 文档、AI preamble 与 bootstrap 渲染器中的重复沟通契约和空洞证据边界
- 保持 release、companion 与任务页逻辑在同一套显式真相上运行

## 范围外

- 不新增新的 orchestration UI、数据库或远端部署能力
- 不重写当前 release registry、companion 生命周期或首页决策板结构
- 不改历史 task 文件名与 release registry 的既有 task id

## 约束

- 短编号必须全局唯一，但历史 task id 与文件名保持稳定
- 任何规则删减都只能删冗余，不得削弱现有 task / release / review 门禁
- 不新增新的持久化真相源；只允许继续收口现有真相与投影

## 关联模块

- `shared/task-identity.ts`
- `scripts/ai/lib/task-resolver.ts`
- `scripts/ai/create-task.ts`
- `scripts/ai/validate-task-git-link.ts`
- `apps/studio/src/modules/tasks/*`
- `apps/studio/src/modules/delivery/*`
- `apps/studio/src/modules/portal/*`
- `docs/AI_OPERATING_MODEL.md`
- `docs/DEV_WORKFLOW.md`
- `docs/PROJECT_RULES.md`
- `docs/ARCHITECTURE.md`
- `memory/project/current-state.md`
- `memory/project/roadmap.md`
- `memory/project/operating-blueprint.md`
- `scripts/compounding_bootstrap/*`

## 当前模式

工程执行


## 分支

`codex/task-038-autonomy-entropy-reduction`


## 最近提交

`auto: branch HEAD`

## 交付收益

让 task、release、首页与 AI preamble 更接近同一套显式真相，减少解析歧义、规则噪声与页面假状态，提升 AI 自主执行的稳定性。


## 交付风险

如果历史 task 台账回填不完整，新的唯一性校验会直接失败；如果规则删减过度，可能误删仍有实际价值的护栏。


## 一句复盘

未复盘


## 主发布版本

未生成


## 关联发布版本

无


## 计划

1. 修复 task identity、portal cockpit 与 delivery snapshot 中仍然存在的歧义与冗余。
2. 回填历史 task 的显式短编号，并解决重复短编号冲突。
3. 收口 `roadmap / current-state / operating-blueprint` 的重复计划表述。
4. 删除 live 文档和 bootstrap 生成器中的空洞证据边界与重复沟通契约。
5. 跑完整校验、生成 dev 预览并交付验收。

## 发布说明

本任务聚焦结构收口与规则瘦身，不新增业务功能；发布影响主要体现在 task 解析、首页读模型和 live 文档表达更加一致。

## 验收标准

- 所有 queue task 都显式填写且全局唯一的短编号
- task resolver、任务页与 release 脚本都不再依赖模糊推断或默认短编号派生
- `current-state` 不再平行维护一份 roadmap 的当前推进清单
- 首页 cockpit 不再保留未消费的假状态或旧证据网格读模型
- live 文档和 AI preamble 不再重复空洞证据边界或多份沟通契约
- `pnpm lint`、`pnpm test`、`pnpm build`、`validate-change-trace`、`validate-task-git-link` 通过

## 风险

- 历史 task 短编号修正后，旧对话里用错短编号的人工习惯需要跟着调整
- 若 bootstrap 渲染器没同步收口，后续 scaffold 仍可能重新生成冗余规则
- 当前生产版本若不经过 preview 验收就直接吸收这轮结构调整，容易把台账问题带到主线
## 状态

doing

## 更新痕迹

- 记忆：`memory/architecture/system-overview.md`
- 索引：`no change: structure cleanup only`
- 路线图：`memory/project/roadmap.md`, `memory/project/operating-blueprint.md`, `memory/project/current-state.md`
- 文档：`tasks/queue/task-038-autonomy-entropy-reduction.md`, `AGENTS.md`, `docs/AI_OPERATING_MODEL.md`, `docs/DEV_WORKFLOW.md`, `docs/PROJECT_RULES.md`, `docs/ARCHITECTURE.md`

## 复盘
