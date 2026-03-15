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

任务 → 最小上下文 → 模块改动 → 记忆回写 → 索引更新 → review → main → release 准备 → `current` 切换 / 回滚 → 新一轮扫描

## 关键边界

- `AGENTS.md` 只做高频执行入口
- `docs/*` 不与 `AGENTS.md` 竞争主源
- `memory/*` 先记忆，后升格
- `code_index/*` 只做导航，不替代真实代码
- 生产 runtime 用 `releases/<id> + current + shared + registry.json` 管理，而不是原地覆盖

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
- 当前阶段：main 直发生产与可回滚发布模型收口
- 当前优先级：{resolved["current_priority"]}
- 成功定义：{resolved["success_definition"]}
- 必须保护：{must_protect}
- 运行边界：{resolved["runtime_boundary"]}

## Current Focus

- 修复生产构建 Tailwind 样式裁剪问题
- 把发布主线切到 `main = production`
- 落地 `releases/<id> + current + shared + registry.json`
- 提供本机/内网发布管理页与回滚入口

## Next Checkpoint

- `pnpm build`
- `pnpm test`
- `python3 scripts/init_project_compounding.py audit --config bootstrap/project_brief.yaml --target .`
- `node --experimental-strip-types scripts/release/prepare-release.ts --ref main`

{evidence_boundary_block()}
"""


def render_tech_debt() -> str:
    return f"""# Tech Debt

## Active Debt

1. 当前发布模型是单机 `systemd + reverse proxy + symlink cutover` 骨架；还没有多进程零停机或多机容灾能力
2. 本机/内网发布管理页已可读写 release registry，但尚未经过真实生产反向代理环境的 live 验证
3. proposal engine 已支持模型优先生成，但默认仍依赖 Ark/Volcano/OpenAI 环境变量；未配置时会回退到 deterministic rewrite
4. `scripts/ai/build-context.ts` 与 `generate-module-index.ts` 仍是轻量版本，后续可继续提高相关性判断和索引精度
5. 当前没有 remote，`main` 直发生产只在本地仓库语义上成立；远端分支和 release tag 推送仍需后续接通

## Delete Plan

- 任何仍然保留的 legacy 文本或兼容路径，都要在下一轮重构中删除或归档
- 任何新增临时层都必须写清删除触发条件
- 若后续验证 `systemctl restart` 对当前流量影响仍偏大，再评估更细粒度的 reload / socket activation 策略

{evidence_boundary_block()}
"""


def render_roadmap(resolved: dict[str, Any]) -> str:
    return f"""# Roadmap

## Current Phase

生产直发与可回滚发布模型收口

## Current Priority

{resolved["current_priority"]}

## Acceptance Ladder

1. 生产构建样式稳定
2. `main` 成为唯一生产主线
3. release 准备、切换与回滚骨架可用
4. UI 可查看近期 releases 与改动摘要
5. 失败发布不会切走当前线上版本

## Current Execution TODOs

- [x] 修复生产态 Tailwind 裁剪，恢复首页和文档页样式
- [x] 切换到 `main = production` 的发布规则
- [x] 建立 `releases/<id> + current + shared + registry.json`
- [x] 新增本机/内网发布管理页与 deploy / rollback API
- [x] 补齐 systemd 与 reverse proxy skeleton
- [x] 把发布与回滚规则写回 AGENTS / docs / memory

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
