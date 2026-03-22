# 响应契约与短任务编号固化

## 短编号

t-016

## 目标

把“更细的默认回复格式、验收说明、先给任务摘要再给方案、任务短编号”固化到仓库主源、工作流和任务模板中，避免继续依赖口头约定。

## 为什么

这类协作习惯已经成为长期要求。如果不写进主源并同步到任务模板和脚本，后续 AI 进入仓库时仍可能回退成旧习惯。

## 范围

- 更新 `AGENTS.md`
- 更新 `docs/AI_OPERATING_MODEL.md`
- 更新 `docs/DEV_WORKFLOW.md`
- 更新 `tasks/templates/task-template.md`
- 更新 `scripts/ai/create-task.ts`

## 范围外

- 不改首页或任务页 UI
- 不执行下一个主线任务
- 不调整当前 roadmap 主线

## 约束

- 规则必须简洁，不新增官僚层
- 新要求要能被后续任务创建流程自动继承
- 任务短编号采用 `t-xxx` 形式，不替换现有稳定文件名

## 关联模块

- `AGENTS.md`
- `docs/AI_OPERATING_MODEL.md`
- `docs/DEV_WORKFLOW.md`
- `tasks/templates/task-template.md`
- `scripts/ai/create-task.ts`

## 当前模式

发布复盘

## 分支

`codex/task-016-response-contract-and-short-task-id`

## 最近提交

`auto: branch HEAD`

## 交付收益

统一沟通契约和短编号表达，降低人机协作时的引用歧义和交付格式波动。

## 交付风险

若短编号和脚本输入不统一，沟通层收口后仍会在工具链里出现二次歧义。

## 一句复盘

协作契约只有进入任务模板、脚本和页面，才算真正生效。

## 计划

1. 把响应契约与验收说明写进主源和 AI 工作流。
2. 给任务模板与任务生成脚本补上 `短编号` 字段。
3. 只输出下一个主线任务的可执行方案，不提前执行。

## 发布说明

本任务只更新协作规则、任务模板和创建脚本，不触发运行态变化。

## 验收标准

- `AGENTS`、`AI_OPERATING_MODEL`、`DEV_WORKFLOW` 对新回复契约描述一致
- 新任务模板包含 `短编号`
- `create-task` 生成的新任务会自动带 `t-xxx`
- 下一个主线任务只给方案，不执行

## 风险

- 如果只更新文档不更新模板/脚本，后续任务仍会回退成旧格式
- 如果把回复契约写得过重，会反过来拖慢沟通

## 状态

done

## 更新痕迹

- 记忆：no change: collaboration rule update only
- 索引：no change: no index impact
- 路线图：no change: current priority unchanged
- 文档：`AGENTS.md`, `docs/AI_OPERATING_MODEL.md`, `docs/DEV_WORKFLOW.md`, `tasks/templates/task-template.md`, `tasks/queue/task-016-response-contract-and-short-task-id.md`

## 复盘

- 已把默认验收说明、任务摘要先于方案、`t-xxx` 短编号固化进主源、工作流和任务模板，后续无需再依赖口头约定。
