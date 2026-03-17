# 建立分层验证体系

## 目标

把当前分散的检查收口成清晰的分层验证体系，明确静态、构建、运行时与 AI 输出四层门禁，降低发布与迭代过程中的不确定性。

## 为什么

当前仓库已经有 `lint`、`test`、`build`、`audit`、`prod:check`、`validate-change-trace`、`validate-task-git-link` 等检查，但它们还没有被组织成一套成本清晰、职责清晰的验证模型。借鉴 `gstack` 的分层验证思路，可以让问题定位更快，也让发布链路更稳。

## 范围

- 盘点现有检查脚本与门禁，按验证成本和目标重新分层
- 定义每一层的适用场景、必跑时机、失败语义与输出格式
- 收口发布前和本地开发期的推荐校验顺序
- 更新规则文档与发布/开发工作流，避免重复与冲突

## 范围外

- 不引入复杂 CI 平台或外部评估系统
- 不新增高成本自动化回归矩阵
- 不把所有检查都强制升级成发布阻断项

## 约束

- 优先复用现有脚本和命令，不无意义新造轮子
- 验证体系必须服务于效率，不为了看起来“专业”而增加层数
- 错误输出应尽量直接告诉下一步动作

## 关联模块

- `scripts/ai/*`
- `scripts/local-runtime/*`
- `scripts/release/*`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- `docs/PROJECT_RULES.md`

## 当前模式

质量验收

## 分支

`codex/task-010-layered-validation-system`

## 最近提交

`auto: branch HEAD`

## 计划

- 盘点现有校验链，明确哪些属于静态、构建、运行时和 AI 输出层
- 收口每层的命令入口、失败语义和推荐使用时机
- 用最小文档和脚本改动把分层验证真正固化下来

## 发布说明

本任务会调整发布前推荐校验顺序、发布页提示与 package 校验命令；完成后需提供 dev 预览链接验收，再决定是否晋升到 main 与 production。

## 验收标准

- 验证体系被明确定义为少数几层，且每层职责不重叠
- 任意执行者能快速判断当前需要跑哪一层检查
- 发布链路中的关键门禁顺序清晰、错误语义清晰
- 现有检查脚本得到复用，而不是被新的重复脚本替代

## 风险

- 若分层过细，会增加理解和维护成本
- 若层级命名不清，仍会变成“很多检查但不知先跑哪个”
- 若把低价值检查都提升为硬门禁，会拖慢主线效率

## 状态

doing

## 更新痕迹

- 记忆：`no change: planning candidate only`
- 索引：`no change: planning candidate only`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-010-layered-validation-system.md, AGENTS.md, docs/DEV_WORKFLOW.md, docs/AI_OPERATING_MODEL.md, docs/PROJECT_RULES.md, memory/project/current-state.md, apps/studio/src/app/releases/page.tsx`

## 复盘

- 当前四层门禁已经可执行，但 `validate:static:strict` 仍会暴露 6 个已知软上限文件；这说明 strict 版本更适合作为治理推进器，而不是当前每次发布的默认硬阻断项。
