from __future__ import annotations

from .defaults import HARD_FILE_LIMIT, SOFT_FILE_LIMIT


def bullet_list(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def evidence_boundary_block() -> str:
    return """## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
"""


def render_readme(resolved: dict[str, object]) -> str:
    return f"""# 仓库说明

这是一个面向 AI 长期协作的 AI-Native Repo。默认先读 `AGENTS.md`，再按需进入 `docs/*`、`memory/*`、`code_index/*` 和 `tasks/*`。

## 快速开始

1. 先读 `AGENTS.md`
2. 运行 `python3 scripts/pre_mutation_check.py`
3. 打开当前任务：`tasks/queue/*.md`
4. 需要更深上下文时，读 `docs/PROJECT_RULES.md`、`docs/ARCHITECTURE.md`、`docs/DEV_WORKFLOW.md`、`docs/AI_OPERATING_MODEL.md`
5. 需要理解组织分工和角色职责时，读 `docs/ORG_MODEL.md`

## 仓库结构

- `apps/studio/`: 只读文档门户
- `scripts/compounding_bootstrap/`: bootstrap / scaffold / audit / proposal 引擎
- `docs/`: 规则、架构、工作流、AI operating model、重构计划
- `memory/`: 架构记忆、项目状态、经验、ADR
- `code_index/`: 模块索引、依赖图、函数索引
- `tasks/`: 任务模板、任务队列、归档
"""


def render_agents(resolved: dict[str, object]) -> str:
    must_protect = "，".join(str(item) for item in resolved["must_protect"])
    return f"""## 硬规则

- `AGENTS.md` 是仓库内唯一高频执行主源；长文规则落在 `docs/*`，状态和经验落在 `memory/*`。
- 默认先做只读盘点，再做最小可验证改动。
- 默认先做高 ROI 动作，不做过度工程和抽象炫技。
- 任何结构性改动都必须绑定任务、更新相关记忆，并在进入 `main` 前完成 review。
- 巨型 util / helper / common 不允许继续扩张；新增逻辑必须伴随清理或明确删除计划。
- 经验先写入 `memory/experience/*`，稳定后再升格到 `docs/*` 或 `AGENTS.md`。
- 任务是边界，不是官僚表单；roadmap 只记录主线变化，不追踪碎片执行。
- 规范是为了避免熵增，不是为了制造新的熵增；若规则本身拖慢主线，可直接简化规则。
- 生产发布只认 `main`；回滚通过 release 切换完成，不通过 `git reset` 改写线上状态。
- 组织角色只是稳定职责镜头，不是官僚部门；组织设计并入总经办，不单列 HR。

## 当前状态

- 项目名称：{resolved["project_name"]}
- 项目一句话：{resolved["project_one_liner"]}
- 当前优先级：{resolved["current_priority"]}
- 成功定义：{resolved["success_definition"]}
- 必须保护：{must_protect}
- 运行边界：{resolved["runtime_boundary"]}
- 当前主线来源：`memory/project/roadmap.md`
- 当前任务入口：`tasks/queue/*.md`，优先处理 `doing` 状态任务

## 默认回复格式

1. 已完成清单
2. 证据与当前结论适用边界
3. 风险与待决策
4. 下一步

## 改动门禁

- 只读分析不强制同步。
- 任何文件改动前先运行 `python3 scripts/pre_mutation_check.py`。
- 若 worktree 不干净、存在 staged changes、或分支 `behind/diverged`，先整理或 `git pull --rebase`。
- 可在本地短分支完成开发，但发布动作只认 `main`。
- 发布前必须通过 release build 与 smoke gate；线上回滚走 release registry，不走 git reset。
- 发布和回滚动作必须串行执行，禁止并发切换 release。

## 必读文档

- `docs/PROJECT_RULES.md`
- `docs/ARCHITECTURE.md`
- `docs/ORG_MODEL.md`
- `docs/DEV_WORKFLOW.md`
- `docs/AI_OPERATING_MODEL.md`
- 当前任务文件

## 工作顺序

1. 先读 `AGENTS.md`
2. 再读 `docs/PROJECT_RULES.md` 和 `docs/ARCHITECTURE.md`
3. 再读当前任务、相关 `module.md`、`code_index/*` 与必要记忆
4. 运行 `python3 scripts/pre_mutation_check.py`
5. 只构建最小必要上下文后再改代码
6. 改动后更新 task / memory / code_index / docs
7. 进入 `main` 后再准备 release 与 cutover

## 按需补读

- 代码治理、命名、体量限制：`docs/PROJECT_RULES.md`
- 系统结构、模块边界、依赖方向：`docs/ARCHITECTURE.md`
- worktree / task / PR / reporting：`docs/DEV_WORKFLOW.md`
- AI 标准工作流、上下文和记忆回写：`docs/AI_OPERATING_MODEL.md`
- 组织架构、角色职责、组织设计：`docs/ORG_MODEL.md`
- 系统状态、roadmap、技术债：`memory/project/*`
- 经验和 ADR：`memory/experience/*`、`memory/decisions/*`
- 模块和函数导航：`code_index/*`
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
- roadmap 只反映主线、优先级和阶段变化
- 记忆只沉淀可复用经验或明确裁决，不写流水账
- 组织结构服务于高效协作，不服务于部门扩张和流程表演

## 兼容层规则

- 旧 workflow 前台、旧 API、旧 docs 树不允许再作为 live 结构继续扩张
- 必须收敛到 `AGENTS + docs + memory + code_index + tasks`
- 需要保留的过渡逻辑必须写入 `memory/project/tech-debt.md`

{evidence_boundary_block()}
"""
