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

- 触发：`roadmap`、`operating-blueprint` 或发布标准不清，或者用户要求先共商方向。
- 最小动作：
  1. 先读 `memory/project/roadmap.md` 与 `memory/project/operating-blueprint.md`。
  2. 必要时用 `scripts/ai/create-task.ts` 生成规划 task。
  3. 和用户确认边界后，再进入方案评审或直接结束规划。
- 输出：可执行里程碑、规划 task、更新后的战略真相。

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

### 模式契约

- 工作模式只在 `docs/WORK_MODES.md` 与本工作流内解释，不再保留独立 mode / preamble helper 栈。
- 弱 agent 先按这三条 runbook 切换，不把模式切换写成大型审批流。

## 标准流程

1. 先读 `AGENTS.md`
2. 再读 `docs/PROJECT_RULES.md`、`docs/ARCHITECTURE.md`
3. 再读 `memory/project/roadmap.md` 和 `memory/project/operating-blueprint.md`
4. 若里程碑、蓝图或关键发布标准不清晰，先创建规划 task，并与用户共商后再继续
5. 再读当前任务文件、相关 `module.md`、`code_index/*`
6. 运行 `python3 scripts/pre_mutation_check.py`
7. 完成最小可验证改动
8. 更新 `task / memory / code_index / docs`
9. 运行 `node --experimental-strip-types scripts/ai/validate-change-trace.ts` 与 `node --experimental-strip-types scripts/ai/validate-task-git-link.ts`；`light` 改动允许返回非阻断结果
10. 先生成 `dev` 预览：`node --experimental-strip-types scripts/release/prepare-release.ts --ref HEAD --channel dev`
11. 若已有未验收 `dev`，先提醒用户验收上一个 `dev`
12. 用户验收通过后，再晋升到 `main` 与本地生产
13. 用 `pnpm prod:status`、`pnpm prod:check`、`/releases` 和生产首页链接完成最终验收

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
- 默认先更新 task，再改代码；改完后补齐更新痕迹和必要回写
- 任何 `structural / release` repo-tracked 改动若没有 task 文件变更，视为硬失败
- 每个 task 至少包含 目标 / 为什么 / 范围 / 范围外 / 约束 / 关联模块 / 当前模式 / 分支 / 最近提交 / 计划 / 发布说明 / 验收标准 / 风险 / 状态 / 更新痕迹 / 复盘
- 每个 task 还必须包含短编号；短编号格式固定为 `t-xxx`
- task 模板默认补齐 `交付收益 / 交付风险 / 一句复盘`，供任务页高密度摘要表直接读取
- 修改结束后要同步更新任务状态和验收结果
- 每个 task 对应一条短分支；进入 `main` 后，任务状态与 Git 状态必须一致
- task 默认挂到当前工作模式，而不是挂到角色名称
- 若 roadmap、blueprint 或发布标准不清，task 只能进入 `战略澄清`
- 只有 `质量验收` 通过，task 才能进入 `发布复盘`
- `更新痕迹` 必须明确写出：
  - 记忆
  - 索引
  - 路线图
  - 文档
  若某项无变化，写 `no change: <reason>`

## 文档编辑规则

- 知识库默认只在原阅读界面内直接编辑正文，不默认暴露原始 Markdown
- frontmatter、managed block 与其它托管标记默认隐藏；需要精确修改时再进入高级模式
- AI 文档重构固定采用两步法：
  1. 先提出关键补充问题
  2. 再基于用户补充重构正文
- AI 重构结果必须先预览，再人工应用；不得自动直接落盘
- 若文档结构过于复杂，允许回退到高级模式编辑

## 发布规则

- 每轮 release 默认绑定 1 个主 task，可选 0-2 个辅助 task
- task 是执行边界，release 是验收与回滚边界；不得把二者机械等同
- 新版本必须先在后台 release 目录完成准备，再切换 `current`
- `dev` 预览链接默认指向本地 `3011` 端口，production 默认指向本地 `3010` 端口
- 生成 `dev` 预览前，必须显式指定主 task
- 创建 `dev` 预览成功后，必须提供 `dev` 验收链接
- 验收通过后，必须再次提供 production 验收链接
- 页面与聊天都能触发验收动作，但 release registry 是唯一真相源
- 切换失败前不得影响当前线上版本
- 回滚通过 `scripts/release/rollback-release.ts` 或本机/内网发布管理页执行
- 发布和回滚动作必须串行执行，release lock 未释放前不得触发第二个动作
- 对于 Next.js 门户，服务重载优先使用 `AI_OS_RELOAD_COMMAND` 或 `systemctl restart`
- 在本地 macOS 环境中，若本地生产已在运行，release 切换和回滚会自动调用本地运行时最小重启
- 若本地生产未运行，release 切换不会偷偷拉起新进程；需要手动执行 `pnpm prod:start`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
