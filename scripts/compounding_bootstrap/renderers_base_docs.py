from __future__ import annotations

from .defaults import HARD_FILE_LIMIT, SOFT_FILE_LIMIT


def bullet_list(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def evidence_boundary_block() -> str:
    return ""


def render_readme(resolved: dict[str, object]) -> str:
    return f"""# 仓库说明

这是一个面向 AI 长期协作的 AI-Native Repo。默认先读 `AGENTS.md`，再按需进入 `docs/*`、`memory/*`、`code_index/*` 和 `tasks/*`。

## 快速开始

1. 先读 `AGENTS.md`
2. 运行 `python3 scripts/pre_mutation_check.py`
3. 打开当前任务：`tasks/queue/*.md`
4. 需要理解当前战略与战术时，读 `memory/project/roadmap.md` 和 `memory/project/operating-blueprint.md`
5. 需要更深上下文时，读 `docs/PROJECT_RULES.md`、`docs/ARCHITECTURE.md`、`docs/DEV_WORKFLOW.md`、`docs/AI_OPERATING_MODEL.md`
6. 需要理解组织分工和角色职责时，读 `docs/ORG_MODEL.md`
7. 需要理解业务链与工作模式时，读 `docs/WORK_MODES.md`

## 仓库结构

- `apps/studio/`: 只读文档门户
- `scripts/compounding_bootstrap/`: bootstrap / scaffold / audit / proposal 引擎
- `docs/`: 规则、架构、工作流、AI operating model、重构计划
- `memory/`: 架构记忆、项目状态、经验、ADR
- `code_index/`: 模块索引、依赖图、函数索引
- `tasks/`: 任务模板、任务队列、归档
"""


def render_agents(resolved: dict[str, object]) -> str:
    return f"""## 硬规则

- `AGENTS.md` 是仓库内唯一高频执行主源；长文规则落在 `docs/*`，状态和经验落在 `memory/*`。
- 任何改动前必须先读 `docs/PROJECT_RULES.md` 与 `docs/ARCHITECTURE.md`，再进入对应工作流文档。
- 默认先做只读盘点，再做最小可验证改动。
- 默认先做高 ROI 动作，不做过度工程和抽象炫技。
- 任何结构性改动都必须绑定任务、更新相关记忆，并在进入 `main` 前完成 review。
- 每个执行 task 对应一条短分支；任务状态、最近提交与是否并入 `main` 必须可追踪。
- 每次改动都必须绑定并更新 task；若存在 repo-tracked 改动但无 task 更新，校验器必须直接失败。
- task 短编号必须全局唯一，并显式写入任务文档；不允许再靠文件名或序号隐式推导。
- 巨型 util / helper / common 不允许继续扩张；新增逻辑必须伴随清理或明确删除计划。
- 经验先写入 `memory/experience/*`，稳定后再升格到 `docs/*` 或 `AGENTS.md`。
- 任务是边界，不是官僚表单；roadmap 只记录主线变化，不追踪碎片执行。
- 若里程碑、运营蓝图或关键发布标准不清晰，先创建规划 task，再与用户共商，不得直接进入执行实现。
- 规范是为了避免熵增，不是为了制造新的熵增；若规则本身拖慢主线，可直接简化规则。
- 生产发布只认 `main`；`dev` 只是 preview channel，不是长期 git 主分支；回滚通过 release 切换完成，不通过 `git reset` 改写线上状态。
- 组织角色只是稳定职责镜头，不是官僚部门；组织设计并入总经办，不单列 HR。

## 真相源地图

- 战略真相：`memory/project/roadmap.md`
- 运营快照：`memory/project/current-state.md`
- 战术蓝图：`memory/project/operating-blueprint.md`
- 角色定义：`docs/ORG_MODEL.md`
- 工作模式：`docs/WORK_MODES.md`
- 工作流：`docs/DEV_WORKFLOW.md`
- AI 行为：`docs/AI_OPERATING_MODEL.md`
- 代码导航：`code_index/*`
- 任务入口：`tasks/queue/*.md`
- 高频知识资产：`docs/ASSET_MAINTENANCE.md`

## 默认回复格式

1. 已完成清单
2. 证据与当前结论适用边界
3. 风险与待决策
4. 下一步

## 默认沟通契约

- 交付 `dev` 或 production 页面时，默认同时提供：
  - 环境说明
  - 页面链接
  - 如何验收
- 进入下一候选任务时，默认先提供：
  - 中文任务摘要
  - 可执行方案
  - 待用户确认后再执行
- 任务在对话中默认使用“中文任务摘要 + 短编号”表达；短编号格式固定为 `t-xxx`。

## 改动门禁

- 只读分析不强制同步。
- 任何文件改动前先运行 `python3 scripts/pre_mutation_check.py`。
- 若 worktree 不干净、存在 staged changes、或分支 `behind/diverged`，先整理或 `git pull --rebase`。
- 可在本地短分支完成开发，但发布动作只认 `main`。
- 发布前必须通过 release build 与 smoke gate；线上回滚走 release registry，不走 git reset。
- 发布和回滚动作必须串行执行，禁止并发切换 release。
- 默认推荐校验顺序是：静态门禁 → 构建门禁 → 运行时门禁；只有 AI 相关资产变化时，再补 AI 输出门禁。
- 任务动手前默认先跑 `coord:check:pre-task`，它会同时检查任务 companion、scope guard、运行态与锁状态；高风险时输出决策卡。
- 每轮可验收改动默认先生成 `dev` 预览；若已有未验收 `dev`，先提醒用户验收上一个 `dev`。
- `dev` 验收通过后，才允许晋升到 `main` 与本地生产，并再次提供生产环境验收链接。
- release 默认绑定 1 个主 task，可附带少量辅助 task；task 是执行边界，release 是验收与回滚边界。
"""


def render_project_rules() -> str:
    return f"""# 项目规则

## 目标

这份文档定义当前仓库的代码治理规则。目标不是增加流程，而是降低 AI 理解成本、降低重复逻辑和隐式依赖、稳定支撑多 agent 并行。

## 文件体量限制

- TypeScript / TSX / Python 文件软上限：{SOFT_FILE_LIMIT} LOC
- TypeScript / TSX / Python 文件硬上限：{HARD_FILE_LIMIT} LOC
- 超过软上限时，必须在任务或技术债中写明拆分计划
- 超过硬上限时，不允许继续扩张，必须进入 task queue 或 `memory/project/tech-debt.md`

## 模块边界规则

- 每个一等模块只做一件事
- 模块必须通过明确 public API 对外暴露能力
- 禁止跨模块直接访问内部私有实现
- `apps/studio/src/modules/*` 与 `scripts/compounding_bootstrap/*` 是当前第一批高价值模块域

## 命名治理

- 除非有极明确边界，不允许新增以下名字作为核心承载层：`utils`、`helpers`、`common`、`misc`、`temp`、`final`、`new`、`v2`
- 模块名优先使用能力名，不用历史性或阶段性名字
- 兼容层必须在名字或文档中明确写出删除条件

## 变更契约

- 新增代码必须伴随清理
- 替代旧逻辑时，必须删除旧逻辑、或在技术债中写明兼容层和删除计划
- 任何结构性改动都必须同步更新 `task`、`memory`、`code_index`
- 规则若限制主线效率，可直接更新，但必须同步回 `AGENTS.md`、相关文档和 ADR

## 发布治理

- `main` 是唯一生产主线，不再使用 `dev` 作为发布缓冲层
- 新 release 必须先在后台目录完成安装、构建与 smoke check，成功后才允许切换 `current`
- 线上回滚以 release 切换为准，不以 `git reset` 为准
- 发布失败不得影响当前线上版本；未切换前禁止覆盖现网目录

## 高效组织原则

- 规则服务于效率，不服务于自我扩张
- task 是项目管理清单，不是审批流
- roadmap 只反映主线、优先级和阶段变化；运营蓝图负责拆解当前里程碑
- 记忆只沉淀可复用经验或明确裁决，不写流水账
- 组织结构服务于高效协作，不服务于部门扩张和流程表演

## 兼容层规则

- 旧 workflow 前台、旧 API、旧 docs 树不允许再作为 live 结构继续扩张
- 必须收敛到 `AGENTS + docs + memory + code_index + tasks`
- 需要保留的过渡逻辑必须写入 `memory/project/tech-debt.md`

{evidence_boundary_block()}
"""
