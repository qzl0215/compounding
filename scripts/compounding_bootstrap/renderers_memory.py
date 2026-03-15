from __future__ import annotations

from typing import Any

from .renderers_docs import evidence_boundary_block


def render_system_overview() -> str:
    return f"""# System Overview

## 系统目标

- 让仓库天然适合 AI 长期协作
- 让多 agent 可以围绕 task / module / memory 并行工作
- 让结构、规则和经验能持续收敛，而不是持续膨胀

## 核心模块

- `AGENTS.md`
- `docs/*`
- `memory/*`
- `tasks/*`
- `code_index/*`
- `apps/studio/src/modules/*`
- `scripts/compounding_bootstrap/*`

## 数据流

任务 → 最小上下文 → 模块改动 → 记忆回写 → 索引更新 → PR → 新一轮扫描

## 关键边界

- `AGENTS.md` 只做高频执行入口
- `docs/*` 不与 `AGENTS.md` 竞争主源
- `memory/*` 先记忆，后升格
- `code_index/*` 只做导航，不替代真实代码

## 模块职责

- Studio 负责只读展示
- Bootstrap 引擎负责 scaffold / audit / proposal / apply
- AI 脚本负责扫描、建索引、建上下文、建任务

## 禁止的调用方式

- 禁止跨模块直接依赖私有实现
- 禁止继续堆巨型 `engine.py`
- 禁止未过 preflight 就进入改动

{evidence_boundary_block()}
"""


def render_current_state(resolved: dict[str, Any]) -> str:
    must_protect = "，".join(str(item) for item in resolved["must_protect"])
    return f"""# Current State

## Project Snapshot

- 项目名称：{resolved["project_name"]}
- 当前阶段：AI-Native Repo 第一轮结构重构
- 当前优先级：{resolved["current_priority"]}
- 成功定义：{resolved["success_definition"]}
- 必须保护：{must_protect}
- 运行边界：{resolved["runtime_boundary"]}

## Current Focus

- 规则层改造为 `AGENTS + PROJECT_RULES + ARCHITECTURE + DEV_WORKFLOW + AI_OPERATING_MODEL`
- 搭起 memory / tasks / code_index / scripts/ai 骨架
- 收敛旧 workflow 前台与对应 API
- 拆分 Studio 与 bootstrap 引擎的第一批微模块

## Next Checkpoint

- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`

{evidence_boundary_block()}
"""


def render_tech_debt() -> str:
    return f"""# Tech Debt

## Active Debt

1. 当前已清空超软上限文件，但 proposal 链路仍可继续沿 `generation / patch / git` 三层再下切，给后续增长留余量
2. proposal engine 已支持模型优先生成，但默认仍依赖 `OPENAI_API_KEY + OPENAI_MODEL`；未配置时会回退到 deterministic rewrite
3. `scripts/ai/build-context.ts` 与 `generate-module-index.ts` 仍是轻量版本，后续可继续提高相关性判断和索引精度
4. code health strict gate 已接入 CI，但目前只做规则检查，不做自动修复或 issue 自动创建
5. 当前还没有真正独立 worktree 的强制校验；执行纪律仍主要靠 `DEV_WORKFLOW` 和 preflight

## Delete Plan

- 任何仍然保留的 legacy 文本或兼容路径，都要在下一轮重构中删除或归档
- 任何新增临时层都必须写清删除触发条件
- 仍接近软上限的 bootstrap 模块，在下一轮继续下切

{evidence_boundary_block()}
"""


def render_roadmap(resolved: dict[str, Any]) -> str:
    return f"""# Roadmap

## Current Phase

AI-Native Repo 第一轮收口

## Current Priority

{resolved["current_priority"]}

## Acceptance Ladder

1. 规则层已建立
2. 记忆层已建立
3. 上下文层已建立
4. 第一批微模块已落地
5. 旧前台和旧 API 已从默认构建入口移除

## Current Execution TODOs

- [x] 建立 `AGENTS + docs/*` 宪法层
- [x] 建立 `memory / tasks / code_index / scripts/ai` 骨架
- [x] 删除旧 workflow 前台、旧 API、旧组件
- [x] 稳定 bootstrap 引擎拆分后的 scaffold / audit / propose / apply
- [x] 让 code health scan 与 module index 进入日常工作流
- [x] 继续压缩高于软上限的 bootstrap 模块
- [x] 收敛共享 classnames helper 的命名债
- [x] 把 proposal 升级为模型优先生成 + block-level apply contract
- [x] 让 `build-context.ts` 按 task / module / memory 精准选材
- [x] 把 code health strict gate 接入 CI

{evidence_boundary_block()}
"""


def render_experience_readme() -> str:
    return """# Experience README

这里记录尚未升格为长期规则的经验。默认先记忆，再验证，再决定是否升格。

## Entry Format

- Context
- Decision
- Why
- Impact
- Reuse

## Promotion Candidates

- 重复出现 2 次以上且无明显例外的经验，才能候选升格
- 若现有规则已直接阻碍 roadmap 主线效率，可直接改规，但必须同步写 ADR
"""


def render_experience_entry(title: str, context: str, decision: str, why: str, impact: str, reuse: str) -> str:
    return f"""# {title}

## Context

{context}

## Decision

{decision}

## Why

{why}

## Impact

{impact}

## Reuse

{reuse}
"""


def render_adr(title: str, context: str, decision: str, consequences: str) -> str:
    return f"""# {title}

## Context

{context}

## Decision

{decision}

## Consequences

{consequences}
"""
