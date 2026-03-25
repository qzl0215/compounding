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
last_reviewed_at: 2026-03-26
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 需求总览

继续把结构收口落到真正会制造熵增的边界上：`t-058` 与 `t-059` 已经把 CLI 外壳和 release/task 状态链收正，当前主线切到 `t-061`，先收薄 `portal` 读模型聚合层，把首页摘要、Kernel/Project snapshot 和运行态翻译从单文件里拆开；目标仍是减少对象歧义和重复外壳，而不是增加新框架。

## 待思考

- portal 读模型聚合边界应先收哪一层，才能在不扩页面逻辑的前提下减少首页/任务页/发布页之间的耦合
- `fix-first` 的 gate registry 后续是否还值得进一步数据化，还是保持当前轻量脚本更划算
- task 模板渲染与经验模板渲染是否还需要再统一一层，还是只共享 task 合同底座已经足够

## 待规划

- `Harness Delta Hardening`：把“文档是主源”升级成可校验的新鲜度契约，并让小型熵减事项能被周期性暴露和消费
- `t-061` 完成后，再评估 release 兼容壳是否仍值得继续下沉，或是否继续切 portal 的更细共享 helper
- `README`、文档门户和 bootstrap manifest 怎样继续表达主干 / 附录分层，而不增加新文档族
- 第二个老项目 attach 样本应怎样选择，才能尽快验证 `project_brief / bootstrap_report / proposal` 在非本仓库上的复用性
- 新项目最小 shell 里哪些协议入口应继续压缩，避免 bootstrap 又回到“复制整套仓库”的旧路

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
- 本地 production 只从固定 runtime 副本启动，不再直接从 release worktree 启动
- 首页只保留需求总览，不展开细节工作台
- 不新增独立想法池文件、数据库、第二套工单系统或新的发布状态源
- `docs/PROJECT_RULES.md`、`docs/AI_OPERATING_MODEL.md`、`docs/ASSET_MAINTENANCE.md` 只作为专项附录，不回到默认第一跳

## 计划产出任务

- `t-048`：把 task 合同模板收口成唯一可渲染来源（已完成）
- `t-049`：规则文档去重（已完成）
- `t-050`：高频文档结构合理化，把高频阅读面收成 4 文档主干 + 3 状态主源（已完成）
- `t-051`：把 `AGENTS` 激进瘦身成真正的执行入口，并让迁出的内容在对应主源中各归其位（已完成）
- `t-052`：保留单一 plan，废除规划 task，让 planning 只作为阶段动作留在 `operating-blueprint`（已完成）
- `t-053`：让本地 production 从固定 runtime 副本启动，切断对 release worktree 的运行依赖（已完成）
- `t-054`：把 Compounding 收口成 `single-kernel + project-shell` 的最小可运行闭环，优先打通老项目 `attach -> audit -> proposal`，再补新项目最小 `bootstrap` 与低风险 `apply`（已完成）
- `t-055`：把知识主源升级为可校验的新鲜度与质量护栏（已完成）
- `t-056`：把持续垃圾回收收口成轻量候选生成器（已完成）
- `t-058`：把 `scripts/ai` 的重复 CLI 外壳收口成极薄共享内核，先服务 `template-feedback`、`fix-first` 与 `create-task`（已完成）
- `t-059`：收正 `dev -> main -> prod` 之后的 release/task 状态一致性，避免假 `pending dev` 与主源漂移继续回流（已完成）
- `t-061`：收薄 portal 读模型聚合层，让 `builders.ts` 退化为薄 barrel（进行中）

## 下一步对话

- 先扩选项：补问题定义、价值、时机、替代方案、范围外和失败方式
- 再收决策：只收目标、取舍、优先级、成功标准和验收标准
- 最后产出 task：只有边界清楚后才进入执行 task
- 若某个 task 发现边界过大，先把剩余未收口范围退回 plan，再从 plan 派生多个 sibling tasks
- 需要收口高频文档时，优先删掉默认第一跳里的重复入口和粗粒度说明，而不是再写新的导读或说明书
- `t-061` 完成后，再评估 release 兼容壳是否仍值得继续下沉，或是否继续切 portal 的更细共享 helper
- knowledge freshness gate 与 cleanup candidate 已落地，下一阶段只继续轻量消费其输出，不再把它们扩成第二套状态源
- 若运行问题来自 worktree、软链或 cwd 耦合，优先把运行目录从输入目录中拆开，而不是继续堆 release 台账
- 若下一轮继续推进 kernel/shell，先拿第二个老项目验证 attach/audit/proposal 的复用性，再决定是否扩大 `auto_apply`

## 测试策略

- 用 needle 搜索确认高频文档里旧 headings、旧角色句和旧读链提示已退出
- 用 `pnpm test`、`pnpm lint`、`pnpm build` 验证消费方仍能读取主源
- 用 `scripts/ai/build-context.ts`、AI 文档重写上下文和知识库精选入口验证新读链已生效
- 用 `pnpm prod:status`、`pnpm prod:check` 和 `git worktree list` 验证本地 production 已脱离 release worktree
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
