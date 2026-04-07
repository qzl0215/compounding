# 任务 gstack 对齐矩阵与引入边界

## 短编号

t-030

## 目标

产出一份 `gstack -> Compounding` 对齐矩阵，明确哪些能力直接吸收、哪些需要改造后吸收、哪些明确不吸收，并把后续实现任务边界固定下来。

## 为什么

当前仓库已经吸收了部分 `gstack` 思路，但还缺一份统一、可执行的对齐矩阵。若继续零散引入，很容易把高价值流程与门禁能力、浏览器基础设施、客户端绑定能力混在一起，既增加维护成本，也偏离当前项目“轻主源、强门禁、少平行体系”的初心。

## 范围

- 盘读 `gstack` 的 README、ARCHITECTURE、BROWSER、CLAUDE、TODOS 与 package scripts
- 形成唯一的 `gstack -> Compounding` 对齐矩阵
- 将结论分为 `直接吸收 / 改造后吸收 / 明确不吸收`
- 为后续 `t-031`、`t-032`、`t-033` 固定目标边界和顺序
- 回写 roadmap / current-state / operating-blueprint，明确这轮主线是规划而非直接实现

## 范围外

- 不直接实现 `t-031`、`t-032`、`t-033`
- 不重做当前发布模型
- 不引入 Bun 浏览器守护进程、Claude 专属 slash-skill 生态或新的重型运行时

## 约束

- 继续以 Markdown 为真相源，不新增数据库或平行状态表
- 吸收重点放在流程、门禁、交付产物和任务前安全护栏
- 对齐矩阵必须直接映射到本项目具体落点，不能停留在抽象评论

## 关联模块

- `memory/experience/gstack-alignment.md`
- `memory/project/roadmap.md`
- `memory/project/current-state.md`
- `memory/project/operating-blueprint.md`
- `tasks/queue/task-030-gstack-alignment-and-adoption-boundary.md`
- `tasks/queue/task-031-work-mode-entry-and-runbook.md`
- `tasks/queue/task-032-diff-aware-qa-review-retro.md`
- `tasks/queue/task-033-pre-task-safety-guardrails.md`

## 当前模式

发布复盘

## 分支

`codex/task-030-gstack-alignment-boundaries`

## 最近提交

`93da11c feat: add gstack alignment boundary and planning tasks`

## 交付收益

把 `gstack` 的高价值能力引入边界一次性说清楚，避免后续继续零散借鉴、重复规划和错误引入重型基础设施。

## 交付风险

如果矩阵只是“点评文档”而没有明确到本项目落点，后续任务仍会重新讨论同一批取舍；如果对不吸收的边界写得不够硬，后续仍可能被浏览器 daemon 一类重型能力带偏。

## 一句复盘

gstack 引入边界已固定，后续任务边界清楚。

## 主发布版本

`20260319034822-4dff6cf-dev`

## 关联发布版本

`20260319034822-4dff6cf-dev`

## 计划

1. 盘读 `gstack` 核心文档和脚本入口，形成唯一对齐矩阵。
2. 把吸收方向固定成模式入口、差异感知 QA/Review/Retro、预任务安全护栏三条主线。
3. 创建 `t-031`、`t-032`、`t-033` 候选任务，并把当前主线切到 `t-030` 的规划输出。

## 发布说明

本任务已完成对齐矩阵与引入边界，并已发布到 main 与本地生产。

## 验收标准

- `memory/experience/gstack-alignment.md` 能清楚区分 `直接吸收 / 改造后吸收 / 明确不吸收`
- 每一项都能回答：它解决什么问题、当前是否已有同类能力、最小落点在哪里、为什么值得或不值得
- `t-031`、`t-032`、`t-033` 的边界清楚，不与当前系统职责冲突
- roadmap / current-state / operating-blueprint 对本轮主线描述一致

## 风险

- 过度抽象会让对齐矩阵失去执行价值
- 若把浏览器 daemon 或客户端绑定能力留成模糊项，后续仍会产生错误吸收
- 若主线文档不同步，规划结论仍会漂移

## 状态

done

## 更新痕迹

- 记忆：`memory/experience/gstack-alignment.md`, `memory/project/current-state.md`, `memory/project/operating-blueprint.md`
- 索引：`no change: docs and planning only`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-030-gstack-alignment-and-adoption-boundary.md`, `tasks/queue/task-031-work-mode-entry-and-runbook.md`, `tasks/queue/task-032-diff-aware-qa-review-retro.md`, `tasks/queue/task-033-pre-task-safety-guardrails.md`

## 复盘

- 对齐矩阵已完成。
- 后续任务边界已固定。
- 已发布到 main 与本地生产。
