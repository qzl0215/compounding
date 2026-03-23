---
title: DEV_WORKFLOW
doc_role: operation
update_mode: manual
owner_role: Builder
status: active
last_reviewed_at: 2026-03-22
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/WORK_MODES.md
  - docs/AI_OPERATING_MODEL.md
  - tasks/templates/task-template.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 开发工作流

## 主发布规则

- `main` 是唯一生产主线
- 本地短分支仍可用于临时开发，但发布动作只认 `main`
- `dev` 是 preview channel，不是长期 git 主分支
- 同一时间只允许一个待验收 `dev`

## 需求环节优先

- 任何工作先判断当前处于哪个需求环节，再决定是否建 task、是否直接执行：
  - `待思考`：只允许启发式追问，不进入执行 task
  - `待规划`：先收口范围、取舍、优先级和验收标准；只有规划工作本身明确时，才允许存在规划 task
  - `待执行`：目标、范围、约束和验收标准已清楚，可以进入执行 task
  - `执行中`：默认围绕 task、阻塞与风险推进，不再回到模糊讨论
  - `待验收`：先给链接和判断标准，不继续堆新改动
  - `已发布`：先做复盘与后续影响判断
- `task` 是执行边界，不承接未成熟需求；模糊事项继续留在 `roadmap / operating-blueprint`
- 当前只允许一层 plan；`memory/project/operating-blueprint.md` 是唯一 plan 主源，`roadmap` 只记录战略摘要与里程碑
- 人只做价值判断、需求澄清和结果验收；AI 默认负责其余执行闭环

## 预任务护栏

- `light` 改动默认跳过 `coord:check:pre-task`；`structural / release` task 真正开始动手前，默认先跑 `coord:check:pre-task`
- `pre-task` 默认同时检查：
  - 工作区是否干净
  - 任务 companion
  - scope guard
  - 运行态状态
  - file/module 锁状态
- `pre-task` 的检查结果会回写到任务 companion 的 `pre_task` 生命周期，不再只停留在终端输出
- 若发现工作区未清理、运行态异常、scope 越界或锁冲突，`pre-task` 会输出决策卡，不直接让任务静默开工
- 决策卡只收口高风险选择，不替代正常的 runbook 和门禁链

## 高频工作链 runbook

### 规划链

- 触发：方向成立但边界、取舍、优先级、成功标准或体验验收标准不清。
- 最小动作：
  1. 先读 `memory/project/operating-blueprint.md`，再对齐 `memory/project/roadmap.md` 的战略摘要。
  2. 先扩选项，再收关键决策，最后决定是否产出 task。
  3. 只有规划工作本身明确时，才用 `scripts/ai/create-task.ts` 生成规划 task。
- 输出：单层 plan、体验验收标准、必要时产出的 task。

### 执行链

- 触发：task 已确认，准备开始实现。
- 最小动作：
  1. 先读当前 task、相关 `module.md`、`code_index/*`。
  2. 需要上下文压缩时，用 `scripts/ai/build-context.ts`；默认只拉 `AGENTS.md`、`docs/PROJECT_RULES.md`、`docs/ARCHITECTURE.md`、当前 task、相关 `module.md` 与命中的 `code_index/*`。
  3. 动手前先跑 `python3 scripts/pre_mutation_check.py`。
- 输出：最小可验证改动、task 回写、必要的 memory / docs / index 回写。

### 交付链

- 触发：实现已完成，准备验收、发布或回滚。
- 最小动作：
  1. 先跑 `node --experimental-strip-types scripts/ai/validate-change-trace.ts` 与 `node --experimental-strip-types scripts/ai/validate-task-git-link.ts`。
  2. 再按 release 流程准备 `dev` 预览：`node --experimental-strip-types scripts/release/prepare-release.ts --ref HEAD --channel dev`。
  3. 如果已有未验收 `dev`，先提醒用户验收上一个 `dev`。
  4. 用户验收通过后，再晋升到 `main` 与本地生产。
  5. 最后用 `pnpm prod:status`、`pnpm prod:check` 和 `/releases` 完成生产验收。
- 输出：`dev` / production 验收链接、release 切换结果、复盘结论。
- companion contract 在这一链路中承担 machine-readable delivery contract：
  - `coord:task:create` 初始化 companion
  - `coord:task:start` 写回 `pre_task`
  - `coord:task:handoff` 写回 `handoff`
  - `coord:task:merge` 通过 review 写回 `review`
  - release prepare / accept / switch 写回 `release_handoff`
  - companion 只承接机器执行上下文，不再镜像 task 正文；task 摘要、风险和完成定义默认从 task 合同读取

### 模式契约

- 工作模式只在 `docs/WORK_MODES.md` 与本工作流内解释，不再保留独立 mode / preamble helper 栈。
- 弱 agent 先按这三条 runbook 切换，不把模式切换写成大型审批流。

## 标准流程

1. 先读 `AGENTS.md`
2. 再读 `docs/PROJECT_RULES.md`、`docs/ARCHITECTURE.md`
3. 再读 `memory/project/operating-blueprint.md`、`memory/project/roadmap.md` 与 `memory/project/current-state.md`
4. 先判断当前是 `待思考 / 待规划 / 待执行 / 执行中 / 待验收 / 已发布`
5. 若仍处于 `待思考`，先扩问题、价值、时机、替代方案与失败方式，不进入执行 task
6. 若处于 `待规划`，先收目标、范围外、取舍、优先级和体验验收标准；只有规划工作本身明确时，才创建规划 task，并在涉及价值判断或用户可感知分叉时与用户共商
7. 若已进入 `待执行 / 执行中`，再读当前任务文件、相关 `module.md`、`code_index/*`
8. 运行 `python3 scripts/pre_mutation_check.py`
9. 完成最小可验证改动，并更新 `task / memory / code_index / docs`
10. 运行 `node --experimental-strip-types scripts/ai/validate-change-trace.ts` 与 `node --experimental-strip-types scripts/ai/validate-task-git-link.ts`；`light` 改动允许返回非阻断结果
11. 用户可感知改动默认先生成 `dev` 预览：`node --experimental-strip-types scripts/release/prepare-release.ts --ref HEAD --channel dev`
12. 若已有未验收 `dev`，先提醒用户验收上一个 `dev`
13. 用户可感知改动在 `dev` 验收通过后，再晋升到 `main` 与本地生产；内部低风险改动可由 AI 自验收并直接闭环
14. 用 `pnpm prod:status`、`pnpm prod:check`、`/releases` 和生产首页链接完成最终验收

## 分层验证顺序

### 静态门禁

- 推荐命令：`pnpm validate:static`
- 推荐命令：
  - `pnpm validate:static`
  - `pnpm validate:static:strict`（用于继续收技术债）
- 包含：
  - `pnpm lint`
  - `pnpm ai:scan-health`
  - `pnpm ai:validate-trace`
  - `pnpm ai:validate-task-git`
- 何时跑：
  - 每次代码改动后，进入 `dev` 预览前
- 失败语义：
  - 说明当前改动还不满足最基本的结构、命名、task 回写或代码风格要求
- 下一步：
  - 先修 task / lint / 扫描类问题，再进入构建门禁
  - 若要继续压缩软上限文件和技术债，再补跑 `pnpm validate:static:strict`

### 构建门禁

- 推荐命令：`pnpm validate:build`
- 包含：
  - `pnpm test`
  - `pnpm build`
  - `pnpm bootstrap:audit`
- 何时跑：
  - 静态门禁通过后，生成 `dev` 预览前
- 失败语义：
  - 说明代码虽能通过静态检查，但在测试、构建或 scaffold / audit 层仍不稳定
- 下一步：
  - 先修测试、构建或 audit 失败，再重新跑构建门禁

### 运行时门禁

- 推荐命令：
  - `pnpm preview:check`
  - `pnpm prod:check`
- 何时跑：
  - `dev` 预览生成后
  - production 切换后
- 失败语义：
  - 说明版本可能已准备完成，但服务没有真正健康在线，或当前运行态与 release 语义不一致
- 下一步：
  - 先看 `/releases`、runtime status 和端口状态，再决定是重启、重切换还是回滚

### AI 输出门禁

- 推荐命令：`pnpm validate:ai-output`
- 包含：
  - AI prompt 资产完整性检查
  - AI 重构接口支撑文件检查
  - provider 配置是否半残的检查
- 何时跑：
  - 修改 prompt、AI 文档重构链路、AI 文档接口时
  - 准备发布这类改动时
- 失败语义：
  - 说明 AI 输出链路的输入资产或配置不值得信任
- 下一步：
  - 先补 prompt / 路由 / provider 资产，再进入发布链路

## 沟通归宿

- 默认回复结构与页面交付契约以 `AGENTS.md` 为唯一高频归宿
- 本文只补工作流本身，不再重复维护另一套沟通模板

## 任务规则

- `light` 改动可只更新 `docs / memory / code_index / 现有 task`，不强制新建或绑定结构性 task
- 每个 `structural / release` 改动必须绑定 `tasks/queue/*`
- 默认先更新 task 执行合同，再改代码；机器台账改由 companion、release 与投影层回写
- 任何 `structural / release` repo-tracked 改动若没有 task 文件变更，视为硬失败
- 每个 task 至少包含：
  - `短编号`
  - `父计划`
  - `任务摘要`
  - `为什么现在`
  - `承接边界`
  - `完成定义`
  - `要做`
  - `不做`
  - `约束`
  - `关键风险`
  - `测试策略`
  - `状态`
  - `体验验收结果`
  - `交付结果`
  - `复盘`
- 每个 task 还必须包含短编号；短编号格式固定为 `t-xxx`
- 不是每个 task 都必须新增测试，但每个结构性 task 都必须写清测试策略：为什么要测、测什么、不测什么、为什么当前最划算
- 修改结束后要同步更新任务状态和验收结果
- 每个 task 对应一条短分支；进入 `main` 后，任务状态与 Git 状态必须一致，但分支、最近提交、release 版本、planned files、review 与 handoff 等机器事实不再手工写入 task 正文
- task 默认挂到当前工作模式，而不是挂到角色名称；若页面需要显示机器事实，统一从 companion / release / delivery projection 读取
- 若 roadmap、blueprint 或发布标准不清，task 只能进入 `战略澄清`
- 只有 `质量验收` 通过，task 才能进入 `发布复盘`
- `更新痕迹`、`关联模块`、`主发布版本`、`关联发布版本` 等 provenance 不再作为 task 合同正文必填项；它们由 companion / release registry / 校验器生成物负责
- release 只保留环境与验收事实；task 摘要只在历史兼容时回退到最小 `delivery_snapshot`

## 文档编辑规则

- 知识库默认只在原阅读界面内直接编辑正文，不默认暴露原始 Markdown
- frontmatter、managed block 与其它托管标记默认隐藏；需要精确修改时再进入高级模式
- AI 文档重构固定采用两步法：
  1. 先提出关键补充问题
  2. 再基于用户补充重构正文
- AI 重构结果必须先预览，再人工应用；不得自动直接落盘
- 若文档结构过于复杂，允许回退到高级模式编辑

## Test 治理

- 默认采用风险驱动最小集，不以测试数量作为完成感
- `待思考` 只识别风险，不写测试代码
- `待规划` 先定义测试策略和关键失败模式
- `待执行 / 执行中` 只补最能抓关键错误的测试
- `待验收` 以 smoke、运行时检查和体验验收为主
- 被更高层稳定覆盖、长期不抓独特错误、保护已删除行为或成本过高的测试，应合并、降级或退休

## 发布规则

- 每轮 release 默认绑定 1 个主 task，可选 0-2 个辅助 task
- task 是执行边界，release 是验收与回滚边界；不得把二者机械等同
- 新版本必须先在后台 release 目录完成准备，再切换 `current`
- `dev` 预览链接默认指向本地 `3011` 端口，production 默认指向本地 `3010` 端口
- 生成 `dev` 预览前，必须显式指定主 task
- 创建 `dev` 预览成功后，必须提供 `dev` 验收链接
- 验收通过后，必须再次提供 production 验收链接
- 用户可感知改动必须先经过 `dev` 验收；内部低风险改动允许 AI 自验收并直接收口
- 页面与聊天都能触发验收动作，但 release registry 是唯一真相源
- 切换失败前不得影响当前线上版本
- 回滚通过 `scripts/release/rollback-release.ts` 或本机/内网发布管理页执行
- 发布和回滚动作必须串行执行，release lock 未释放前不得触发第二个动作
- 对于 Next.js 门户，服务重载优先使用 `AI_OS_RELOAD_COMMAND` 或 `systemctl restart`
- 在本地 macOS 环境中，若本地生产已在运行，release 切换和回滚会自动调用本地运行时最小重启
- 若本地生产未运行，release 切换不会偷偷拉起新进程；需要手动执行 `pnpm prod:start`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
