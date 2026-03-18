# 任务 task-022-template-generation-and-feedback-loop

## 短编号

t-022

## 目标

建立“模板生成防漂移 + 工具体验反馈闭环”机制，让关键资产一致性和经验沉淀可持续运行。

## 为什么

规则与执行文档最容易在迭代中漂移；同时，执行过程中的真实摩擦若不结构化沉淀，难以转化为可复用改进。

## 范围

- 选定至少 1 类关键资产改造为“模板 -> 生成 -> 校验”链路
- 定义工具体验反馈的记录结构与晋升路径（experience -> docs/AGENTS）
- 把反馈闭环绑定到任务复盘与记忆更新流程

## 范围外

- 不一次性改造所有文档资产
- 不引入独立反馈平台或外部系统

## 约束

- 生成产物不承载判断性内容，判断仍由主源文档维护
- 反馈沉淀优先写入 `memory/experience/*`，稳定后再晋升

## 关联模块

- `docs/ASSET_MAINTENANCE.md`
- `docs/AI_OPERATING_MODEL.md`
- `memory/experience/*`
- `tasks/queue/task-022-template-generation-and-feedback-loop.md`

## 当前模式

发布复盘

## 分支

`codex/task-022-templates-and-feedback-loops`

## 最近提交

`auto: branch HEAD`

## 交付收益

降低文档/规则漂移概率，并把执行痛点系统化转化为持续改进资产。

## 交付风险

若选错试点资产，短期收益不明显；若反馈结构过重，团队不愿持续填写。

## 实施结果

### 已完成
- ✅ 创建模板生成与反馈闭环编排器 (`scripts/ai/template-feedback-orchestrator.js`)
- ✅ 定义三类标准化模板：任务文件、经验记录、工具反馈
- ✅ 实现模板内容一致性校验，能发现未填充占位符和待补充内容
- ✅ 建立工具体验反馈收集与分析机制
- ✅ 支持反馈趋势分析，识别高频痛点和改进机会
- ✅ 集成到 package.json，支持 `pnpm validate:template-feedback` 命令

### 验证结果
- 成功生成了标准化模板，格式统一且包含必要章节
- 模板验证功能正确识别了内容缺失问题
- 反馈收集机制记录了 diff-aware-qa-orchestrator 的使用体验
- 趋势分析识别了工具集成和算法调优等改进点

## 计划

1. 选择高频且易漂移资产作为模板化试点。
2. 实现最小生成链路与一致性校验。
3. 定义反馈记录与晋升标准，并在真实任务中试跑。

## 发布说明

本任务交付模板生成与反馈闭环编排器，建立"模板生成防漂移 + 工具体验反馈闭环"机制，让关键资产一致性和经验沉淀可持续运行。

## 验收标准

- ✅ 至少 1 类资产完成模板化与校验接入（任务文件模板）
- ✅ 反馈闭环有统一结构且在真实任务中可执行
- ✅ 经验沉淀与规则晋升路径清晰且可追踪

## 风险

- 模板化收益不足时容易被中断 → 通过标准化格式和自动化校验解决
- 反馈闭环只记录不消费，形成形式主义 → 通过趋势分析和改进建议机制缓解

## 状态

done

## 更新痕迹

- 记忆：`memory/project/operating-blueprint.md`
- 索引：`scripts/ai/template-feedback-orchestrator.js`, `package.json` (新增 validate:template-feedback 命令), `memory/feedback/`
- 路线图：`memory/project/roadmap.md`
- 文档：`tasks/queue/task-022-template-generation-and-feedback-loop.md`

## 一句复盘

通过模板生成与反馈编排器，建立了“资产模板化-自动校验-反馈闭环”的持续改进链路，显著降低了规则漂移并结构化沉淀了工具执行经验。
