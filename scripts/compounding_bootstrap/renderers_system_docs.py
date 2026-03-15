from __future__ import annotations

from typing import Any

from .renderers_base_docs import bullet_list, evidence_boundary_block


def render_architecture(resolved: dict[str, Any]) -> str:
    studio_modules = resolved["repo_scan"].get("studio_modules") or ["portal", "docs", "git-health"]
    bootstrap_modules = resolved["repo_scan"].get("bootstrap_modules") or [
        "defaults",
        "config_resolution",
        "managed_blocks",
        "document_renderers",
        "scaffold",
        "audit",
        "proposal_engine",
        "engine",
    ]
    return f"""# ARCHITECTURE

## Repository Shape

- `apps/studio/`: 只读文档门户
- `scripts/compounding_bootstrap/`: scaffold / audit / proposal 引擎
- `docs/`: 规则层、架构层、流程层、AI operating model、重构计划
- `memory/`: 架构记忆、项目状态、经验、ADR
- `code_index/`: 模块索引、依赖图、函数索引
- `tasks/`: 模板、队列、归档

## Primary Module Domains

### Studio Modules

{bullet_list([f"`apps/studio/src/modules/{name}`" for name in studio_modules])}

### Bootstrap Engine Modules

{bullet_list([f"`scripts/compounding_bootstrap/{name}.py`" for name in bootstrap_modules])}

## Dependency Direction

1. `AGENTS.md` 提供高频入口
2. `docs/*` 提供长期规则、架构和流程
3. `tasks/*` 给出当前变更边界
4. `code_index/*` 提供上下文导航
5. 代码模块只依赖必要的邻近模块和共享基础层

## First Refactor Batch

- 删除旧 workflow 前台和对应 API
- 把 Studio 收口为 `portal / docs / git-health`
- 把 bootstrap 引擎拆成可维护的 Python 微模块
- 补齐 `memory / tasks / code_index / scripts/ai` 骨架

## Forbidden Call Patterns

- 禁止从 UI 组件跨层读取任意文件系统状态而不经过模块仓储层
- 禁止在 bootstrap 引擎里继续堆单一巨型 `engine.py`
- 禁止把临时上下文直接塞回 `AGENTS.md`

{evidence_boundary_block()}
"""


def render_dev_workflow() -> str:
    return f"""# DEV_WORKFLOW

## Branch And Worktree Rule

- 结构性改动必须在独立 worktree / branch 中完成
- 当前标准分支名：`codex/ai-native-repo-refactor`
- 不允许直接在主线做结构升级

## Standard Flow

1. 先读 `AGENTS.md`
2. 再读 `docs/PROJECT_RULES.md`、`docs/ARCHITECTURE.md`
3. 再读当前任务文件、相关 `module.md`、`code_index/*`
4. 运行 `python3 scripts/pre_mutation_check.py`
5. 完成最小可验证改动
6. 更新 `task / memory / code_index / docs`
7. 提交 PR

## Reporting Contract

- 默认回复结构：
  - 已完成清单
  - 证据与当前结论适用边界
  - 风险与待决策
  - 下一步
- 所有关键报告必须显式区分：
  - 本地离线证据
  - 服务器真实证据
  - 当前结论适用边界

## Task Rule

- 每个结构性改动必须绑定 `tasks/queue/*`
- 任务至少包含 Goal / Why / Scope / Out of Scope / Constraints / Related Modules / Acceptance Criteria / Risks / Status
- 修改结束后要同步更新任务状态和验收结果

## PR Rule

- 结构升级必须通过 PR 合并
- PR 必须说明删除了什么、保留了什么兼容层、还有哪些技术债
- 任何新抽象都必须解释职责和删除条件

{evidence_boundary_block()}
"""


def render_ai_operating_model() -> str:
    return f"""# AI_OPERATING_MODEL

## Standard Reading Order

1. `AGENTS.md`
2. `docs/PROJECT_RULES.md`
3. `docs/ARCHITECTURE.md`
4. 当前任务文件
5. 相关 `module.md`
6. `code_index/*`
7. 必要代码
8. 动手前 `python3 scripts/pre_mutation_check.py`

## Task-Driven Development

- AI 默认围绕 `tasks/queue/*` 工作
- 若任务不存在，先用 `scripts/ai/create-task.ts` 生成
- 任务是 scope 和验收边界，不是可有可无的备注

## Context System

- `code_index/module-index.md` 给模块入口
- `code_index/dependency-map.md` 给依赖方向
- `code_index/function-index.json` 给粗粒度函数索引
- `scripts/ai/build-context.ts` 负责把规则、架构、任务、模块和记忆压缩成最小上下文包

## Memory System

- 新经验先进入 `memory/experience/*`
- 已裁决事项进入 `memory/decisions/ADR-*.md`
- 当前项目状态和 roadmap 在 `memory/project/*`
- 经验重复验证后才允许升格到 `docs/*` 或 `AGENTS.md`

## Self-Improving Loop

扫描问题
→ 生成 task
→ 修改模块
→ 更新 memory
→ 更新 code_index
→ 发起 PR
→ 在下一轮扫描中验证是否真正收敛

## Working Principle

- 优先减少理解成本
- 优先减少重复逻辑
- 优先减少隐式依赖
- 不做大面积业务重写

{evidence_boundary_block()}
"""


def render_refactor_plan(resolved: dict[str, Any]) -> str:
    largest = resolved["repo_scan"].get("largest_files", [])
    largest_section = bullet_list([f"`{path}`: {lines} LOC" for lines, path in largest]) or "- 当前扫描暂无数据"
    return f"""# REFACTOR_PLAN

## Current Problem Overview

- 当前仓库历史上混合了 bootstrap 产品、文档操作系统和半退役 workflow 前台
- 旧 docs 体系、旧 API、旧组件仍对 AI 理解造成噪声
- bootstrap 引擎曾长期集中在单一巨型文件中
- 缺少面向 AI 的 task / memory / code_index 闭环

## Top 10 Priority Problems

1. `AGENTS.md` 必须从长文主源收口为薄入口 bootloader
2. 旧的分层 docs 子树已经不应继续作为 live docs 使用，必须全部归档隔离
3. `scripts/compounding_bootstrap/engine.py` 过大，妨碍维护和并行修改
4. Studio 旧 workflow 页面和 API 已失效但仍残留
5. 任务系统缺失，AI 改动难以绑定明确 scope
6. 项目记忆层和 ADR 没有清晰归宿
7. code index 缺失，AI 每次都要重新摸索模块入口
8. 巨型 util / helper 扩张缺少明确治理阈值
9. 技术债没有系统化沉淀
10. 缺少自进化扫描脚本来持续生成后续任务

## Target Structure

```text
repo/
├─ AGENTS.md
├─ docs/
│  ├─ PROJECT_RULES.md
│  ├─ ARCHITECTURE.md
│  ├─ DEV_WORKFLOW.md
│  ├─ AI_OPERATING_MODEL.md
│  └─ REFACTOR_PLAN.md
├─ memory/
├─ code_index/
├─ tasks/
├─ scripts/ai/
└─ apps/studio/src/modules/
```

## Largest Files Snapshot

{largest_section}

## First Module Split Candidates

- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/portal`
- `apps/studio/src/modules/git-health`
- `scripts/compounding_bootstrap/*`

## High Risk Points

- 改文档结构时容易产生平行主源
- bootstrap 行为改动必须保持 scaffold / audit / propose / apply 对外接口稳定
- 删除旧前台时必须确保 `/` 和 `/knowledge-base` 仍能正常构建

## Refactor Boundary

- 本轮以结构升级为主，不做大面积业务重写
- 允许真实删除旧页面、旧 API、旧组件和重复逻辑
- 允许直接更新规范，只要它们正在限制当前主线效率

{evidence_boundary_block()}
"""
