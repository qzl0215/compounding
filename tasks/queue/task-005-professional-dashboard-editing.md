# 任务 task-005-professional-dashboard-editing

## 目标

把首页文案收口成更专业的经营驾驶舱表达，并补齐 task/Git 联动和 Markdown 直编能力。

## 为什么

当前首页表达偏口语；任务系统还没有真正绑定 Git 运行态；知识库仍然只能只读，不利于高频维护规则、记忆和任务。

## 范围

- 首页文案专业化收口
- task 模板新增分支与最近提交
- `/tasks` 升级为表格视图并接入 Git 状态
- `/knowledge-base` 支持阅读/编辑双模式与保存
- 新增 task/Git 一致性校验

## 范围外

- AI 自动编辑或 AI 润色
- 文档级删除入口
- 引入数据库、协同编辑或 WYSIWYG 编辑器

## 约束

- `main` 仍是唯一生产发布主线
- task 状态的人类真相继续写在 Markdown 中
- Git 只补运行态，不替代人类状态
- scaffold-managed 文档允许全文编辑，但要明确提示托管区块可能被后续 scaffold 覆盖

## 关联模块

- `apps/studio/src/modules/portal`
- `apps/studio/src/modules/tasks`
- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/git-health`
- `scripts/ai/*`
- `tasks/*`

## 分支

`codex/task-005-professional-dashboard-editing`

## 最近提交

`auto: branch HEAD`

## 计划

- 先升级 task 模板、task parser 与 Git 联动
- 再把 `/tasks` 改成表格视图
- 再为 `/knowledge-base` 加阅读/编辑双模式
- 最后收口首页文案并补全校验与文档回写

## 发布说明

这轮主要是本地门户与文档交互升级；进入 `main` 前必须通过 lint/test/build/audit 与 task/Git 校验。

## 验收标准

- 首页文案更专业、少口语
- `task-001` 状态修正为 `done`
- `/tasks` 展示 `状态 + Git` 联动表格
- 文档页支持直接编辑、保存、预览
- 文档级删除按钮不存在

## 风险

- task/Git 联动若设计过重，会反向增加管理成本
- 全文编辑 managed 文档可能被后续 scaffold 覆盖
- 文档保存接口若无访问限制，会带来安全风险

## 状态

doing

## 更新痕迹

- 记忆：`memory/project/current-state.md`, `memory/project/operating-blueprint.md`, `memory/project/roadmap.md`, `memory/project/tech-debt.md`
- 索引：`code_index/module-index.md`, `code_index/dependency-map.md`, `code_index/function-index.json`
- 路线图：`memory/project/roadmap.md`
- 文档：`AGENTS.md`, `docs/DEV_WORKFLOW.md`, `docs/AI_OPERATING_MODEL.md`, `docs/ARCHITECTURE.md`, `docs/REFACTOR_PLAN.md`

## 复盘

待完成后补充。
