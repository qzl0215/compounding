---
title: OPERATING_BLUEPRINT
doc_role: planning
update_mode: manual
owner_role: PMO
status: active
source_of_truth: memory/project/roadmap.md
related_docs:
  - AGENTS.md
  - memory/project/roadmap.md
  - memory/project/current-state.md
  - docs/DEV_WORKFLOW.md
last_reviewed_at: 2026-03-22
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 当前里程碑

AI 自主系统反熵收敛：短编号唯一、规则层瘦身与 cockpit 真相继续收口

## 关键子目标

### 子目标 1：让 task identity 彻底显式且唯一

- 发布标准：
  - 所有 queue task 都显式填写 `t-xxx` 短编号
  - 历史冲突短编号被消除，但 task id 与文件名保持稳定
  - release、resolver、UI 与 companion 不再依赖序号推导

### 子目标 2：把运营快照与战略计划继续拆开

- 发布标准：
  - `current-state` 只保留运营快照、冻结项与检查点
  - `roadmap` 独占当前优先级与执行待办
  - 两份文档不再并行维护同一份推进清单

### 子目标 3：保持首页决策板的最小信息面稳定

- 发布标准：
  - 首页首屏只保留当前阶段、运行与发布、当前阻塞与下一步
  - 不再在首页平铺任务细节、证据列表、旧证据网格或假状态卡

### 子目标 4：压缩重复规则与空洞模板

- 发布标准：
  - live 文档、AI preamble 与 bootstrap 渲染器不再重复空洞证据边界
  - 沟通契约与任务前阅读顺序只保留唯一高频归宿，不再在多份 live 文档中平行复制

## 当前阻塞

- 当前主要风险不是底座缺失，而是结构收口不彻底：若 task identity、文档模板和 cockpit 残余冗余继续并存，AI 自主链路会再次被旧规则噪声拖慢。

## 下一检查点

- [ ] 完成 `t-038` 的短编号唯一性、规则层瘦身与 cockpit 收口
- [ ] 保持任务页、发布页与知识库继续承接详情，不把首页重新做重
- [ ] 在 preview / prod 两条链上确认结构收口没有破坏现有发布闭环
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
