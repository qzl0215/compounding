# 任务 task-027-coord-unattended-polish

## 短编号

t-027

## 目标

完善 Multi-Agent Coordination Layer 面向无人值守的最后一公里：UI 验收产物生成约定、差异摘要生成器、执行模式自动降级优化。

## 为什么

Phase 2 已完善 auto-review 与 merge gate，但人工介入时仍缺少界面化产物与可读差异摘要；执行模式降级策略可进一步减少误操作。

## 范围

- UI 验收产物生成约定（截图/预览链接自动写入 decision card）
- 差异摘要生成器（两版本核心差异可读对比）
- 优化升级策略与执行模式自动降级

## 范围外

- 不引入新的外部截图/录屏服务
- 不实现完整 E2E 自动化

## 约束

- 人工只看界面产物或可读摘要，不看代码 diff
- decision card 必须收敛为 2-3 个明确选项

## 关联模块

- `agent-coordination/decisions/`
- `scripts/coord/decision.ts`
- `scripts/coord/review.ts`

## 当前模式

方案评审

## 分支

`待分配`

## 最近提交

`auto: branch HEAD`

## 交付收益

人工介入时可直接基于界面产物或差异摘要做选择，无需阅读代码；执行模式自动降级减少高风险误操作。

## 交付风险

差异摘要生成若不准会误导决策；UI 产物收集若过重会增加延迟。

## 计划

1. 定义 UI 验收产物格式与落点
2. 实现差异摘要生成器（基于 git diff 或结构化对比）
3. 将 UI 产物与差异摘要接入 decision card
4. 优化 execution mode 降级逻辑

## 验收标准

- decision card 可包含 ui_preview_url 或 screenshot_path
- 差异摘要可生成版本 A vs B 的可读对比
- 执行模式在锁冲突时可自动降级为 patch_only

## 风险

- 截图依赖运行环境
- 差异摘要质量依赖实现

## 状态

todo

## 更新痕迹

- 记忆：`no change: task created only`
- 索引：`no change: task created only`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-027-coord-unattended-polish.md`

## 一句复盘

（待完成）
