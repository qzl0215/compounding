---
title: AI_OPERATING_MODEL
doc_role: reference
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-16
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/WORK_MODES.md
  - docs/DEV_WORKFLOW.md
  - memory/experience/README.md
  - code_index/module-index.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# AI 工作模型

## 标准阅读顺序

1. `AGENTS.md`
2. `docs/PROJECT_RULES.md`
3. `docs/ARCHITECTURE.md`
4. 当前任务文件
5. 相关 `module.md`
6. `code_index/*`
7. 必要代码
8. 动手前 `python3 scripts/pre_mutation_check.py`

## 任务驱动开发

- AI 默认围绕 `tasks/queue/*` 工作
- 若任务不存在，先用 `scripts/ai/create-task.ts` 生成
- 任何 repo-tracked 改动都必须同步更新 task；若没有 task 更新，校验器必须失败
- 若 roadmap / operating-blueprint / 发布标准不清晰，先创建规划 task，再与用户共商
- 任务是 scope 和验收边界，不是可有可无的备注
- 任务的目标是让团队高效协作，而不是制造更多流程负担
- 每个执行 task 都应绑定短分支，并在任务中记录最近提交和是否并入 `main`
- 任务在对话中默认使用“中文任务摘要 + 短编号”表达；短编号固定为 `t-xxx`

## 默认沟通契约

- AI 默认使用以下输出顺序：
  1. 已完成清单
  2. 证据与当前结论适用边界
  3. 风险与待决策
  4. 下一步
- 交付 `dev` 或 production 页面时，默认同时提供：
  - 当前环境说明
  - 首页或关键页面链接
  - 可执行的验收说明
- 进入下一候选任务时，默认顺序固定为：
  1. 中文任务摘要
  2. 可执行方案
  3. 用户确认后再执行
- 若用户尚未确认任务方案，AI 不得直接进入该任务的实现阶段

## 工作模式

- 业务链固定为：`需求提出 → 战略澄清 → 方案评审 → 工程执行 → 质量验收 → 发布复盘`
- 当前系统只保留 5 种高频工作模式：
  - 战略澄清
  - 方案评审
  - 工程执行
  - 质量验收
  - 发布复盘
- 详细定义、输入输出与进入退出条件以 `docs/WORK_MODES.md` 为准
- 选模式的原则是“当前最需要哪种脑力”，而不是“当前角色名叫什么”
- 若路线图、蓝图或成功标准不清，先进入战略澄清
- 若目标已清、边界未定，先进入方案评审
- 若 task 已明确、准备动手，进入工程执行
- 若实现已完成但结果是否达标不明，进入质量验收
- 若准备并入 `main` 或切换 release，进入发布复盘
- 组织角色仍是职责镜头；工作模式是业务链入口，两者不能互相替代

## 上下文系统

- `code_index/module-index.md` 给模块入口
- `code_index/dependency-map.md` 给依赖方向
- `code_index/function-index.json` 给粗粒度函数索引
- `scripts/ai/build-context.ts` 负责把规则、架构、任务、模块和记忆压缩成最小上下文包

## 记忆系统

- 新经验先进入 `memory/experience/*`
- 已裁决事项进入 `memory/decisions/ADR-*.md`
- 当前项目状态、roadmap 和 operating blueprint 在 `memory/project/*`
- 经验重复验证后才允许升格到 `docs/*` 或 `AGENTS.md`
- 角色职责以 `docs/ORG_MODEL.md` 为准，避免在多个文档里平行复制组织设计
- 工作模式以 `docs/WORK_MODES.md` 为准，避免把输入输出和角色职责再次混写

## 自进化闭环

扫描问题
→ 生成 task
→ 修改模块
→ 更新 memory
→ 更新 code_index
→ 进入 `main`
→ 生成 release
→ 切换或回滚
→ 在下一轮扫描中验证是否真正收敛

## 分层验证模型

- 当前系统固定保留 4 层高价值门禁：
  - 静态门禁
  - 构建门禁
  - 运行时门禁
  - AI 输出门禁
- 这 4 层按成本与失败语义排序，不允许再把检查项堆成一个不可解释的大包
- 默认推荐顺序：
  1. `pnpm validate:static`
  2. `pnpm validate:build`
  3. `dev` 预览生成后跑 `pnpm preview:check`
  4. production 切换后跑 `pnpm prod:check`
  5. 若改动涉及 AI 文档重构链路，再补 `pnpm validate:ai-output`
- `pnpm validate:static:strict` 用于继续清理软上限文件与显性技术债，不应默认把现有存量技术债都升级成每次发布的硬阻断项
- 选层原则：
  - 能在静态层发现的问题，不要拖到构建层
  - 能在构建层发现的问题，不要拖到运行时
  - AI 输出层只在 AI 相关资产变化时进入链路，不扩大成所有改动都必跑的重门禁

## 生产直发

- 生产发布以 `main` 为唯一主线
- `dev` 是 preview channel，不是长期 git 主分支
- 每轮可验收改动默认先生成 `dev` 预览链接
- 若存在 `pending dev`，AI 必须先提醒用户验收上一个 `dev`
- 验收通过后，AI 再触发晋升到 `main` 与本地生产，并再次提供生产验收链接
- 交付 `dev` 与 production 链接时，AI 必须默认附带简明的“如何验收”
- 版本构建在后台 release 目录完成
- 线上切换只在构建和 smoke 成功后发生
- 本地生产默认不自动拉起；只有手动执行 `pnpm prod:start` 才会让 `127.0.0.1:3000` 真正在线
- 一旦本地生产已在运行，后续 release 切换或回滚会自动最小重启到新的 `current`
- 若新版异常，优先选择：
  - 继续在 `main` 上修出下一次 release
  - 或直接回滚到上一个健康 release

## 工作原则

- 优先减少理解成本
- 优先减少重复逻辑
- 优先减少隐式依赖
- 不做大面积业务重写
- 创业团队文化优先：持续抓重点，不过度优化，少条条框框，但井井有条
- 规范只保留最关键的三层：规则、工作流、AI operating model；其余优先压回 task / memory / index
- 文档以 Markdown 为唯一真相源；知识库默认编辑正文层，高级模式才编辑完整 Markdown
- prompt 文档是 AI 重构行为的可维护真相源，应支持预览、保存生效与上一版本回退

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
