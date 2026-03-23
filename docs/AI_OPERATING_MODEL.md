---
title: AI_OPERATING_MODEL
doc_role: reference
update_mode: manual
owner_role: Foreman
status: active
last_reviewed_at: 2026-03-23
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

## 最小起步顺序

- 默认先按 `AGENTS.md` 的真相源地图进入对应主源，不在本文件重复维护完整阅读顺序
- AI 进入执行前至少应补齐：
  - 当前任务文件
  - 相关 `module.md`
  - `code_index/*`
  - `python3 scripts/pre_mutation_check.py`

## 任务驱动开发

- AI 默认先判断需求处于 `待思考 / 待规划 / 待执行 / 执行中 / 待验收 / 已发布` 的哪个环节；只有进入可执行边界后，才围绕 `tasks/queue/*` 工作
- 当前只允许一层 plan；唯一 plan 主源是 `memory/project/operating-blueprint.md`
- 若当前事项已进入 `待执行`，但任务不存在，先用 `scripts/ai/create-task.ts` 生成
- 若当前事项仍处于 `待思考 / 待规划`，先更新 `operating-blueprint`，必要时再创建规划 task，不得直接偷渡进执行 task
- `light` 改动可直接维护 `docs / memory / code_index / 现有 task`；`structural / release` 改动若没有 task 更新，校验器必须失败
- 若 roadmap / operating-blueprint / 发布标准不清晰，先创建规划 task，再与用户共商
- 任务是 scope 和验收边界，不是可有可无的备注
- 任务的目标是让团队高效协作，而不是制造更多流程负担
- 每个执行 task 都应绑定短分支；分支、最近提交、planned files、release handoff 与是否并入 `main` 由 companion / release 台账维护，不再手工写入 task 正文
- 任务在对话中默认使用“中文任务摘要 + 短编号”表达；短编号固定为 `t-xxx`
- 任务页默认优先展示交付摘要，而不是工程明细；工程信息在需要时再展开
- `light` 改动可跳过 `coord:check:pre-task`；`structural / release` task 动手前默认先跑 `coord:check:pre-task`，它会同时检查任务 companion、scope guard、运行态和锁状态；高风险时会产出决策卡
- 当前 Delivery Framework 默认把 task companion 视为派生的 machine-readable delivery contract；`create / start / handoff / merge / release handoff` 围绕同一份 companion 回写，但发布主状态仍只认 release registry
- task 合同是唯一人类执行语义；companion 只保留机器执行上下文，release 只保留验收与运行事实，不再各自镜像 task 正文

## Autoplan 契约

- 进入 task 前，AI 固定先做三步：
  1. 扩选项：补问题定义、时机、替代方案、范围外和失败方式
  2. 收决策：只收目标、取舍、优先级、成功标准和体验验收标准
  3. 产出 task：只有边界清楚后才生成执行 task 草案
- 只有 4 类问题需要等人：
  - 价值不清
  - 取舍分叉
  - 用户可感知结果需要验收
  - 高风险或不可逆动作
- 能从仓库、主源、经验或成熟方案回答的实现级问题，AI 自行收口，不再把低价值确认抛给人。
- task 草案默认对齐体验级完成定义，而不是实现动作；若 `完成定义 / 范围外 / taste decision` 仍未收口，先回到 plan。

## Search Before Building 与 Boil the Lake

- `Search Before Building` 只解决一个问题：在 unfamiliar pattern / infra / runtime capability 上，先搜已有，再决定是否自己造。
- 默认搜索顺序只有 3 层：
  1. 仓库已有实现与任务经验
  2. 当前主源与稳定规则
  3. 成熟外部方案或第一性原理
- 搜索只记录最小证据：
  - 搜了什么来源
  - 为什么现成方案不够
  - 当前决定是什么
- 搜索证据写入 companion 机器事实，不回写成长篇 task 正文，也不新增调研文档。
- `Boil the Lake` 只适用于小而边界清楚的 task，含义是“把当前合同做完整”，不是把大需求一口吃掉。
- 若事项跨阶段、多目标、范围外还在变，应该留在 plan；不要为了推进感把海洋伪装成湖。
- 对 task 来说，做透的最低要求是：
  - 合同字段填实
  - 最小必要测试到位
  - 结果、文档和台账一起收口

## AI 特有协作约束

- 默认沟通结构和页面交付契约以 `AGENTS.md` 为唯一高频归宿，不在这里重复维护一整套模板
- AI 特有的附加约束固定为：
  - 若当前事项仍处于 `待思考 / 待规划`，且价值、边界或成功标准未清，不得直接进入实现阶段
  - AI 只把价值判断、体验取舍和结果验收抛给人；实现细节、仓库可解问题和低价值确认默认自行处理
  - 若当前事项是已有模式的直接延伸，AI 直接执行；若涉及 unfamiliar pattern / infra / runtime capability，先补最小 search evidence
  - 用户可感知变化默认走 `dev` 验收；内部低风险改动可由 AI 自验收并直接闭环
  - 若任务 companion、task 或 release 主源出现冲突，先修主源，再继续执行

## 需求成熟度判断

- AI 在进入工作模式前，先判断当前需求处在哪个环节：
  - `待思考`
  - `待规划`
  - `待执行`
  - `执行中`
  - `待验收`
  - `已发布`
- `待思考` 的特征是：问题定义、价值判断、成功标准或范围边界还没说清
- `待规划` 的特征是：方向成立，但取舍、优先级、验收标准或范围外还没收口
- `待执行` 的特征是：目标、范围、约束与验收标准已经足够清楚，可以进入 task
- `执行中 / 待验收 / 已发布` 继续以 task、release 与运行态事实为准
- AI 对不同环节的默认动作固定如下：
  - `待思考`：扩问题、价值、时机、替代方案与失败方式，不创建执行 task
  - `待规划`：收目标、取舍、范围外、优先级和体验验收标准；需要时可创建规划 task
  - `待执行`：确认 task 边界后进入工程执行
  - `待验收`：先给验收入口和判断标准，不继续堆新改动
  - `已发布`：先做复盘与后续影响判断
- task 仍然只承接可执行边界，不承接“用户随手想到但尚未说清”的内容

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

## 最小脚本契约

- 规划链默认脚本：`scripts/ai/create-task.ts`
  - 适用场景：需要先共商边界、生成规划 task、再进入方案评审。
- 执行链默认脚本：`scripts/ai/build-context.ts`、`node --experimental-strip-types scripts/ai/validate-change-trace.ts`、`node --experimental-strip-types scripts/ai/validate-task-git-link.ts`
  - 适用场景：task 已明确、准备动手、需要最小上下文与任务绑定校验。
- 交付链默认脚本：`node --experimental-strip-types scripts/release/prepare-release.ts --ref HEAD --channel dev`、`node --experimental-strip-types scripts/release/accept-dev-release.ts`、`node --experimental-strip-types scripts/release/reject-dev-release.ts`、`node --experimental-strip-types scripts/release/rollback-release.ts`
  - 适用场景：准备 `dev` 预览、验收通过、需要驳回或回滚。
- 这些脚本只承接最小契约，不替代 `docs/WORK_MODES.md`、`docs/DEV_WORKFLOW.md` 或任务边界。

## 上下文系统

- `code_index/module-index.md` 给模块入口
- `code_index/dependency-map.md` 给依赖方向
- `code_index/function-index.json` 给粗粒度函数索引
- `scripts/ai/build-context.ts` 默认只把规则、架构、任务、模块和命中的 `code_index/*` 压成最小上下文包；workflow / AI model / project memory 改为显式按需附加
- `docs/ASSET_MAINTENANCE.md` 给高频知识资产的维护方式矩阵，帮助区分哪些走生成、哪些走校验、哪些继续人工维护

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

## Test 治理

- test 采用风险驱动最小集，不以数量换安全感
- `待思考`：只识别风险，不写测试代码
- `待规划`：先写测试策略，说明为什么测、测什么、不测什么
- `待执行 / 执行中`：只补最能抓关键错误的测试
- `待验收`：补 smoke、运行时检查与体验验收
- `已发布`：被更高层稳定覆盖、长期不抓独特错误、保护旧行为或执行成本过高的测试，应合并、降级或退休

## 生产直发

- 生产发布以 `main` 为唯一主线
- `dev` 是 preview channel，不是长期 git 主分支
- release 默认绑定 1 个主 task，可选少量辅助 task；task 是执行边界，release 是验收与回滚边界
- 每轮可验收改动默认先生成 `dev` 预览链接
- 若存在 `pending dev`，AI 必须先提醒用户验收上一个 `dev`
- 验收通过后，AI 再触发晋升到 `main` 与本地生产，并再次提供生产验收链接
- 交付 `dev` 与 production 链接时，AI 必须默认附带简明的“如何验收”
- 版本构建在后台 release 目录完成
- 线上切换只在构建和 smoke 成功后发生
- 本地生产默认不自动拉起；只有手动执行 `pnpm prod:start` 才会让 `127.0.0.1:3010` 真正在线
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
- 高频知识资产先按 `generated / validated / manual` 三分法分类，再决定维护方式；不要在未分层前把所有文档一股脑推进生成式
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
