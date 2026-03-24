---
title: OPERATING_BLUEPRINT
update_mode: manual
status: active
source_of_truth: memory/project/operating-blueprint.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/current-state.md
  - docs/DEV_WORKFLOW.md
last_reviewed_at: 2026-03-24
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 需求总览

把高频阅读面收成 4 文档主干 + 3 状态主源：`AGENTS / WORK_MODES / DEV_WORKFLOW / ARCHITECTURE` 负责治理主干，`roadmap / current-state / operating-blueprint` 负责战略、运营快照和唯一 plan 主源。目标是减少默认必读面、减少重复解释、让每份高频文档只回答一类问题。

## 待思考

- 默认读链里是否还有不值得保留的第一跳文档或入口
- 文档门户里的精选入口该怎样体现“主干 / 附录”分层，而不重新制造新导航体系
- `build-context` 与 AI 重写上下文是否还保留了不必要的附录输入

## 待规划

- `AGENTS` 应如何进一步瘦到只剩执行原则、默认读链和最小门禁，而不再混入 runbook、专项治理和运行事实
- `WORK_MODES / DEV_WORKFLOW / ARCHITECTURE` 的边界怎样写到既单一又不丢执行信息
- `README`、文档门户和 bootstrap manifest 怎样表达主干 / 附录分层，而不增加新文档族

## 计划边界

- 只允许一层 plan，唯一主源是 `memory/project/operating-blueprint.md`
- `AGENTS` 只保留硬规则、默认读链和改动门禁
- `WORK_MODES` 只保留场景语义、输入、允许动作和退出条件
- `DEV_WORKFLOW` 只保留 runbook、门禁顺序和发布顺序
- `ARCHITECTURE` 只保留仓库拓扑、依赖方向、运行时拓扑和禁止调用方式
- `roadmap` 只保留阶段、里程碑、优先级、方向和成功标准
- `current-state` 只保留运营快照、当前阻塞、冻结项和检查点
- `task` 只承接可执行事项与执行合同，不承接模糊想法，也不承接机器台账
- `companion` 只保留机器执行上下文，不再镜像 task 正文
- `release` 只保留验收与运行事实；task 摘要只在历史兼容时回退到最小 `delivery_snapshot`
- 首页只保留需求总览，不展开细节工作台
- 不新增独立想法池文件、数据库、第二套工单系统或新的发布状态源
- `docs/PROJECT_RULES.md`、`docs/AI_OPERATING_MODEL.md`、`docs/ASSET_MAINTENANCE.md` 只作为专项附录，不回到默认第一跳

## 计划产出任务

- `t-048`：把 task 合同模板收口成唯一可渲染来源（已完成）
- `t-049`：规则文档去重（已完成）
- `t-050`：高频文档结构合理化，把高频阅读面收成 4 文档主干 + 3 状态主源（已完成）
- `t-051`：把 `AGENTS` 激进瘦身成真正的执行入口，并让迁出的内容在对应主源中各归其位（进行中）

## 下一步对话

- 先扩选项：补问题定义、价值、时机、替代方案、范围外和失败方式
- 再收决策：只收目标、取舍、优先级、成功标准和验收标准
- 最后产出 task：只有边界清楚后才进入执行 task
- 需要收口高频文档时，优先删掉默认第一跳里的重复入口和粗粒度说明，而不是再写新的导读或说明书

## 测试策略

- 用 needle 搜索确认高频文档里旧 headings、旧角色句和旧读链提示已退出
- 用 `pnpm test`、`pnpm lint`、`pnpm build` 验证消费方仍能读取主源
- 用 `scripts/ai/build-context.ts`、AI 文档重写上下文和知识库精选入口验证新读链已生效
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
