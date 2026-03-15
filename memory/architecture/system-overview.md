---
title: SYSTEM_OVERVIEW
doc_role: memory
update_mode: promote_only
owner_role: Architect
status: active
last_reviewed_at: 2026-03-15
source_of_truth: docs/ARCHITECTURE.md
related_docs:
  - docs/ARCHITECTURE.md
  - code_index/dependency-map.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 系统总览

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

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
