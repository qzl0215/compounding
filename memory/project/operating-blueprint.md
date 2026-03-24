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

把模糊事项彻底收回 `memory/project/operating-blueprint.md`，废除“规划 task”作为常规对象：plan 只负责 deciding，task 只负责 delivering，planning 是阶段动作，不再是长期对象类型。

## 待思考

- 哪些历史 task 或 companion 还残留“战略澄清 / 方案评审”语义，后续是否值得继续清理
- 当一个执行 task 发现边界过大时，哪些剩余范围应该回到 plan，避免重新长成 task 树
- portal / task / release 兼容壳里是否还有会把 planning 从 plan 重新拉回 task 的旧逻辑

## 待规划

- `scripts/ai` 的重复编排逻辑应先收哪一层，才能在不造框架的前提下减少维护成本
- task 拆分回 plan 的最小规则应怎样写，才能避免 task 树化
- `README`、文档门户和 bootstrap manifest 怎样继续表达主干 / 附录分层，而不增加新文档族

## 计划边界

- 只允许一层 plan，唯一主源是 `memory/project/operating-blueprint.md`
- planning 只是一种阶段动作，不再对应长期“规划 task”对象
- `AGENTS` 只保留硬规则、默认读链和改动门禁
- `WORK_MODES` 只保留场景语义、输入、允许动作和退出条件
- `DEV_WORKFLOW` 只保留 runbook、门禁顺序和发布顺序
- `ARCHITECTURE` 只保留仓库拓扑、依赖方向、运行时拓扑和禁止调用方式
- `roadmap` 只保留阶段、里程碑、优先级、方向和成功标准
- `current-state` 只保留运营快照、当前阻塞、冻结项和检查点
- `task` 只承接可执行事项与执行合同，不承接模糊想法、待规划事项或机器台账
- `companion` 只保留机器执行上下文，不再镜像 task 正文
- `release` 只保留验收与运行事实；task 摘要只在历史兼容时回退到最小 `delivery_snapshot`
- 首页只保留需求总览，不展开细节工作台
- 不新增独立想法池文件、数据库、第二套工单系统或新的发布状态源
- `docs/PROJECT_RULES.md`、`docs/AI_OPERATING_MODEL.md`、`docs/ASSET_MAINTENANCE.md` 只作为专项附录，不回到默认第一跳

## 计划产出任务

- `t-048`：把 task 合同模板收口成唯一可渲染来源（已完成）
- `t-049`：规则文档去重（已完成）
- `t-050`：高频文档结构合理化，把高频阅读面收成 4 文档主干 + 3 状态主源（已完成）
- `t-051`：把 `AGENTS` 激进瘦身成真正的执行入口，并让迁出的内容在对应主源中各归其位（已完成）
- `t-052`：保留单一 plan，废除规划 task，让 planning 只作为阶段动作留在 `operating-blueprint`（进行中）

## 下一步对话

- 先扩选项：补问题定义、价值、时机、替代方案、范围外和失败方式
- 再收决策：只收目标、取舍、优先级、成功标准和验收标准
- 最后产出 task：只有边界清楚后才进入执行 task
- 若某个 task 发现边界过大，先把剩余未收口范围退回 plan，再从 plan 派生多个 sibling tasks
- 需要收口高频文档时，优先删掉默认第一跳里的重复入口和粗粒度说明，而不是再写新的导读或说明书
- 下一轮若继续做结构收口，先看脚本重复与兼容壳，再决定是否进入新的实现任务

## 测试策略

- 用 needle 搜索确认高频文档里旧 headings、旧角色句和旧读链提示已退出
- 用 `pnpm test`、`pnpm lint`、`pnpm build` 验证消费方仍能读取主源
- 用 `scripts/ai/build-context.ts`、AI 文档重写上下文和知识库精选入口验证新读链已生效
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
