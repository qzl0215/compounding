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
last_reviewed_at: 2026-03-23
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 需求总览

在已经完成单层 Plan、Task 执行合同、最小 Companion 与最小 Release 边界的基础上，只继续吸收 gstack 中高真实 ROI、且不会制造新熵增的轻思想：Search Before Building、Boil the Lake、Autoplan、Diff-based test selection。目标不是复制外部基础设施，而是继续提高 AI 的判断质量、自主性和长期复利。

## 待思考

- Search Before Building 的最小“搜索证据”该长什么样，才能证明 AI 先搜过，又不变成新 paperwork
- “Boil the Lake” 的边界如何定义，才能让小 task 做透而不让 task 膨胀失控
- Diff-based test selection 怎样在不新增验证层的前提下，提高命中率并减少重复测试

## 待规划

- Search Before Building 与 Boil the Lake 应如何嵌入 task 创建、pre-task 和 AI 行为规则
- Autoplan 的“扩选项 → 收决策 → 产出 task”要落在哪些主源与工作流里，才能不再把低价值确认抛给人
- Diff-based test selection 的 `SelectedChecks / CheckSelectionReason` 最小读模型该放在哪里，才能既可解释又不造新状态源

## 计划边界

- 只允许一层 plan，唯一主源是 `memory/project/operating-blueprint.md`
- `roadmap` 只保留阶段、里程碑、优先级、方向和成功标准
- `task` 只承接可执行事项与执行合同，不承接模糊想法，也不承接机器台账
- `companion` 只保留机器执行上下文，不再镜像 task 正文
- `release` 只保留验收与运行事实；task 摘要只在历史兼容时回退到最小 `delivery_snapshot`
- 首页只保留需求总览，不展开细节工作台
- 不新增独立想法池文件、数据库、第二套工单系统或新的发布状态源
- 不吸收 Bun daemon、重型浏览器运行时、Claude 绑定生态或多会话 orchestration 基础设施

## 计划产出任务

- `t-040`：单层 Plan、阶段优先与首页需求总览收口（已完成）
- `t-041`：把 task 重构成共享执行合同，并把机器 provenance 下沉到 companion / release / 投影层（已完成）
- `t-042`：把 `plan / task / companion / release` 收口成四个稳定对象，各自只负责一类真相（已完成）
- `t-043`：刷新 gstack 的高 ROI 吸收清单，并产出下一批低熵增执行 task（已完成）
- `t-044`：Search Before Building 与 Boil the Lake 规则落地（待执行）
- `t-045`：Autoplan 式人机决策收口（待执行）
- `t-046`：Diff-based test ROI 优化（待执行）

## 下一步对话

- 先扩选项：补问题定义、价值、时机、替代方案、范围外和失败方式
- 再收决策：只收目标、取舍、优先级、成功标准和验收标准
- 最后产出 task：只有边界清楚后才进入执行 task
- 涉及 unfamiliar pattern / infra / runtime capability 时，先搜仓库、搜主源、再决定是否自建

## 当前阻塞

- 当前主要风险不是底座缺失，而是若把 Search Before Building、Autoplan 或 Diff-based selection 做成额外 paperwork，它们会从“提高判断质量”变回“新的流程负担”。

## 测试策略

- `待思考`：只识别风险，不写测试代码
- `待规划`：先定义验收标准和关键失败模式，写出测试策略
- `待执行 / 执行中`：只补最能抓关键错误的最小测试集
- `待验收`：补 smoke、运行时检查和用户可感知验收
- `已发布`：保留仍能保护活跃行为的测试，退休重复、死掉或长期不抓独特错误的测试
- 默认优先级：静态门禁 → 构建/集成 → 运行时 smoke → 用户可感知体验验收 → AI 输出门禁
- 新增原则：测试与验证优先按 diff 范围选，不再靠堆数量表达质量

## 下一检查点

- [x] 确认 `operating-blueprint` 已成为唯一 plan 主源
- [x] 确认 `t-042` 已把 Plan / Task / Companion / Release 的最简边界切开
- [x] 确认 gstack 的高 ROI 增量吸收项已刷新，并形成 `t-044 ~ t-046`
- [ ] 确认 Search Before Building 能在不制造新 paperwork 的前提下落地
- [ ] 确认 Boil the Lake 只约束小而边界清楚的 task，不让 task 膨胀
- [ ] 确认 Autoplan 只把价值判断和体验取舍抛给人
- [ ] 确认 Diff-based test selection 能提高命中率且不增加验证层
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
