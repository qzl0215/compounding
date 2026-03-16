# 建设防漂移文档与索引资产

## 目标

提升 prompt、索引和关键说明文档的防漂移能力，让高频知识资产更稳定、更可信、更适合长期被 AI 与人共同使用。

## 为什么

当前仓库已经有 prompt 文档、`code_index/*`、规则文档与 scaffold 体系，这为防漂移建设提供了良好基础。但高频知识资产仍存在人工同步成本，未来若继续增加提示词、索引和模块说明，容易再次出现“实现变了，文档没跟上”的问题。

## 范围

- 盘点当前最容易漂移的高频资产：prompt、索引、关键说明文档
- 区分哪些适合生成、哪些适合校验、哪些仍应人工维护
- 为优先级最高的一类资产设计防漂移机制
- 更新相关文档与工作流，明确维护方式和真相源

## 范围外

- 不把全部 Markdown 文档改成生成式
- 不重写现有 scaffold 体系为全自动文档引擎
- 不引入数据库或复杂同步平台

## 约束

- 防漂移机制应优先轻量、可解释、易维护
- 生成或校验策略不能掩盖真正的事实来源
- prompt 资产应保留版本、回退和人工 review 的能力

## 关联模块

- `docs/prompts/*`
- `code_index/*`
- `scripts/compounding_bootstrap/*`
- `scripts/ai/*`
- `docs/PROJECT_RULES.md`

## 分支

`codex/task-011-anti-drift-docs-prompts-index`

## 最近提交

`auto: branch HEAD`

## 计划

- 盘点最容易漂移的高频知识资产，并按维护方式分层
- 为优先级最高的一类资产建立最小防漂移机制
- 把真相源、维护方式和边界写回规则文档

## 发布说明

本任务当前仅入列，不触发运行态变化；正式实施时再评估发布影响。

## 验收标准

- 明确哪些资产走生成、哪些走校验、哪些继续人工维护
- 至少一类高频资产具备可执行的防漂移机制
- prompt、索引与说明文档的维护边界更清晰
- 不新增新的平行真相源

## 风险

- 若试图覆盖所有文档，会导致实现过重
- 若真相源定义不清，可能把“防漂移”反做成“制造漂移”
- 若过度自动化，会降低人工 review 的质量控制

## 状态

todo

## 更新痕迹

- 记忆：`no change: planning candidate only`
- 索引：`no change: planning candidate only`
- 路线图：`no change: current priority unchanged`
- 文档：`tasks/queue/task-011-anti-drift-docs-prompts-index.md`

## 复盘
