---
title: OPERATING_BLUEPRINT
doc_role: planning
update_mode: manual
owner_role: PMO
status: active
source_of_truth: memory/project/operating-blueprint.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/current-state.md
  - docs/DEV_WORKFLOW.md
last_reviewed_at: 2026-03-22
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 需求总览

把当前仓库收口成单层 Plan、阶段优先、价值判断优先的 AI 自主系统。AI 先通过多轮详尽沟通扩展选项，再收敛关键决策，最后把执行与发布对准体验级验收结果；task 只作为共享执行合同存在。

## 待思考

- 大而杂的想法怎样在不引入第二层 plan 的前提下，稳定留在主源里持续收敛
- AI 如何更系统地补“想到的”和“没想到但重要的”，避免一上来就给过早方案
- 用户可感知验收结果怎样写得更具体，既不空泛，也不把人拉进实现细节

## 待规划

- 单层 plan 下，什么情况允许直接建 task，什么情况必须先留在 plan 里继续收边界
- `父计划 / 承接边界 / 完成定义 / 测试策略` 的最小 task 合同，需要继续用真实任务验证
- test 的引入、优化和退休规则，需要继续验证是否足够轻且足够能抓关键错误

## 计划边界

- 只允许一层 plan，唯一主源是 `memory/project/operating-blueprint.md`
- `roadmap` 只保留阶段、里程碑、优先级、方向和成功标准
- `task` 只承接可执行事项与执行合同，不承接模糊想法，也不承接机器台账
- 首页只保留需求总览，不展开细节工作台
- 不新增独立想法池文件、数据库、第二套工单系统或新的发布状态源

## 计划产出任务

- `t-040`：单层 Plan、阶段优先与首页需求总览收口
- `t-041`：把 task 重构成共享执行合同，并把机器 provenance 下沉到 companion / release / 投影层
- 后续结构性 task 只在边界清楚后由本计划产出；未成熟事项继续留在本计划内，不偷渡进执行链

## 下一步对话

- 先扩选项：补问题定义、价值、时机、替代方案、范围外和失败方式
- 再收决策：只收目标、取舍、优先级、成功标准和验收标准
- 最后产出 task：只有边界清楚后才进入执行 task
- 已进入待验收时，先完成体验判断，不继续堆新改动

## 当前阻塞

- 当前主要风险不是能力不足，而是若 `roadmap / blueprint / task` 重新混写计划和执行，AI 与人会回到边聊边猜、过早开工的状态。

## 测试策略

- `待思考`：只识别风险，不写测试代码
- `待规划`：先定义验收标准和关键失败模式，写出测试策略
- `待执行 / 执行中`：只补最能抓关键错误的最小测试集
- `待验收`：补 smoke、运行时检查和用户可感知验收
- `已发布`：保留仍能保护活跃行为的测试，退休重复、死掉或长期不抓独特错误的测试
- 默认优先级：静态门禁 → 构建/集成 → 运行时 smoke → 用户可感知体验验收 → AI 输出门禁

## 下一检查点

- [ ] 确认 `operating-blueprint` 已成为唯一 plan 主源
- [ ] 确认 task 只承接清晰执行项，并显式绑定父计划
- [ ] 确认 task 主体不再手工维护分支、提交、release 和 update trace
- [ ] 确认首页只保留需求总览，细节全部下沉
- [ ] 确认测试策略在 task 中可追踪，且不引入重复门禁
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
