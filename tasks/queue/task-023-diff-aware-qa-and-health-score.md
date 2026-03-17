# 任务 task-023-diff-aware-qa-and-health-score

## 短编号

t-023

## 目标

落地 diff-aware QA 与健康评分：基于改动范围自动生成测试关注点、证据落点与可读摘要，减少“全量回归式”低效验收。

## 为什么

当前 QA 结论往往依赖人工经验挑选测试路径，难以复用且难以追溯；引入 diff-aware 能让“该测什么”从主观判断变为可解释流程，并为验收提供稳定证据。

## 范围

- 定义 diff-aware QA 的输入（diff / changed files / 模块影响面）与输出（测试清单 / 结论摘要 / 健康评分）
- 绑定到现有验证链路，让静态/构建/运行时门禁输出能汇总为 QA 结论
- 明确证据落点（logs / 页面 / 截图 / 命令输出）与最小可验证标准

## 范围外

- 不做大规模端到端回归矩阵
- 不引入新的外部 QA 平台

## 约束

- 健康评分必须可解释，且给出明确下一步动作
- 默认优先覆盖高 ROI：任务页、发布页、首页摘要、关键脚本门禁

## 关联模块

- `apps/studio/src/modules/tasks/*`
- `apps/studio/src/modules/releases/*`
- `scripts/ai/scan-code-health.ts`
- `scripts/ai/validate-change-trace.ts`
- `scripts/ai/validate-task-git-link.ts`
- `tasks/queue/task-023-diff-aware-qa-and-health-score.md`

## 当前模式

方案评审

## 分支

`codex/task-023-diff-aware-qa-and-health-score`

## 最近提交

`auto: branch HEAD`

## 交付收益

验收从“泛泛回归”变为“围绕改动影响面的有证据验收”，提升效率与可追踪性，并降低遗漏风险。

## 交付风险

若健康评分口径不稳，会造成误导；若输出过长，会降低执行者采纳率。

## 计划

1. 定义 diff-aware QA 输出结构：测试关注点、证据落点、风险标签、健康评分。
2. 选择 1 条真实改动链路试跑并收敛口径。
3. 把结论摘要接入首页/任务页的可见位置（只做投影，不造新真相）。

## 发布说明

本任务以“可执行的 QA 契约 + 最小实现”先跑通闭环，再逐步提升覆盖面与解释力。

## 验收标准

- diff-aware QA 输出结构稳定且可在真实任务中执行
- 能给出健康评分与证据落点，并能解释评分依据
- 至少 1 次真实改动的验收过程可被复用与追溯

## 风险

- 输出只做“总结”而不指向可执行动作
- 评分驱动错误激励（追分而不是追质量）

## 状态

todo

## 更新痕迹

- 记忆：`memory/project/operating-blueprint.md`
- 索引：`no change: 本轮仅新增任务编排`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-023-diff-aware-qa-and-health-score.md`

## 一句复盘

未复盘
