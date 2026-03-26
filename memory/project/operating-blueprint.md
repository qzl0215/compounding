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
last_reviewed_at: 2026-03-28
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 运营蓝图

## 需求总览

继续把结构收口落到真正会制造熵增的边界上：`t-058` 与 `t-059` 已经把 CLI 外壳和 release/task 状态链收正，`t-061` 已把 `portal` 读模型聚合层收成薄 barrel，`t-062` 已把首页 shell 收成薄入口，`t-064` 已把首页从 `Kernel / Project` 工程视角改成人类可扫读的项目逻辑态势图；`t-063` 已把对外门禁收成 `pnpm preflight`，`t-068` 已把耗时/弯路复盘先收成轻量 TTL 轨迹、companion digest 和候选派生产物，`t-069` 已把服务器访问面、GitHub 接入方式和标准发布流统一进 `bootstrap/project_operator.yaml`，并补上可生成可校验的 runbook 与跨工具薄入口。当前主线回到派生产物语义收口、跨页面唯一 snapshot 与 release 单一状态机，目标仍是减少对象歧义和重复外壳，而不是增加新框架。
`t-065` 已完成：把 Studio 整体切到浅色实验室风格，统一首页、任务、证据和发布页的底色、卡片、导航与控件语气，避免局部改版继续把控制台感重新带回首屏。
`t-066` 已完成：高频模块已补成可机读 feature 合同，`build-context` 已升级成 feature 入口，首页、任务页、发布页也开始读取同一份项目状态摘要；diff-aware 选测已经收成 `required / recommended`，AI 加功能时不必再手工拼第一轮上下文。

## 待思考

- 首页逻辑图还需要多大粒度的节点和摘要，才能真正帮助人快速判断项目态势，而不是换一层新的说明书
- `code_index/*`、`output/*`、coordination 产物和 runtime 事实应怎样进一步收成统一的“主源 / 派生物”语义，而不是继续保留 4 套名字
- `fix-first` 的 gate registry 后续是否还值得进一步数据化，还是保持当前轻量脚本更划算
- task 模板渲染与经验模板渲染是否还需要再统一一层，还是只共享 task 合同底座已经足够

## 待规划

- `Harness Delta Hardening`：把“文档是主源”升级成可校验的新鲜度契约，并让小型熵减事项能被周期性暴露和消费
- 跨页面唯一 snapshot：把首页、任务页、发布页的主摘要收成单一读链，避免继续各自翻译
- release 单一状态机：继续清掉 task / release / runtime 之间残余的状态兼容壳
- feature context 第二轮：根据第一批模块合同和 smoke 结果，再收短 `build-context` / `preflight` / `SelectedChecks` 的默认入口
- `t-068` 完成后，按既定顺序继续推进派生产物语义收口、跨页面唯一 snapshot 和 release 单一状态机
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
- 首页只保留项目态势判断与逻辑结构图，不展开工程内部对象工作台
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
- `t-061`：收薄 portal 读模型聚合层，让 `builders.ts` 退化为薄 barrel（已完成）
- `t-062`：收薄 portal 首页 shell，让 `home-dashboard.tsx` 退化为薄入口（已完成）
- `t-064`：把首页重构为项目逻辑态势图，移除 `Kernel / Project` 工程视角并让逻辑节点可点击（已完成）
- `t-065`：把 Studio 整体切到浅色实验室风格，统一首屏、列表、文档和发布页的视觉语气（已完成）
- `t-066`：给高频模块补 feature 合同，把 `build-context` 升级成 feature 入口，引入共享项目状态摘要与 required / recommended 选测（已完成）
- `t-063`：统一 preflight 入口，让 `pnpm preflight` 成为唯一对外推荐门禁，并让完整 task guard 不再依赖当前 diff 误判（已完成）
- `t-068`：记录 structural/release task 的阶段耗时与重复 blocker，把 raw trace 压成 companion digest 与 retro candidate（已完成）
- `t-069`：统一服务器 / GitHub / 发布运维契约，生成 OPERATOR_RUNBOOK 与跨工具薄入口（已完成）

## 下一步对话

- 先扩选项：补问题定义、价值、时机、替代方案、范围外和失败方式
- 再收决策：只收目标、取舍、优先级、成功标准和验收标准
- 最后产出 task：只有边界清楚后才进入执行 task
- 若某个 task 发现边界过大，先把剩余未收口范围退回 plan，再从 plan 派生多个 sibling tasks
- 需要收口高频文档时，优先删掉默认第一跳里的重复入口和粗粒度说明，而不是再写新的导读或说明书
- 需要收口首页时，优先让人能一眼看懂目标、阶段、风险和下一步，而不是继续展示系统内部结构
- `t-064` 完成后，再按顺序推进跨页面 snapshot 单一化和 release 状态机压实
- 需要让 AI 加 feature 更快时，先补模块合同、feature context、共享状态摘要和 required / recommended 选测，不先加新的治理层
- knowledge freshness gate 与 cleanup candidate 已落地，下一阶段只继续轻量消费其输出，不再把它们扩成第二套状态源
- 若运行问题来自 worktree、软链或 cwd 耦合，优先把运行目录从输入目录中拆开，而不是继续堆 release 台账
- 若下一轮继续推进 kernel/shell，先拿第二个老项目验证 attach/audit/proposal 的复用性，再决定是否扩大 `auto_apply`

## 测试策略

- 用 needle 搜索确认高频文档里旧 headings、旧角色句和旧读链提示已退出
- 用 `pnpm test`、`pnpm lint`、`pnpm build` 验证消费方仍能读取主源
- 用 `scripts/ai/build-context.ts`、AI 文档重写上下文和知识库精选入口验证新读链已生效
- 用 `pnpm prod:status`、`pnpm prod:check` 和 `git worktree list` 验证本地 production 已脱离 release worktree
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
