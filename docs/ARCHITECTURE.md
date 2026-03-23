---
title: ARCHITECTURE
doc_role: reference
update_mode: promote_only
status: active
last_reviewed_at: 2026-03-22
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - code_index/module-index.md
  - memory/architecture/system-overview.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 架构

## 仓库结构

- `apps/studio/`: 只读文档门户
- `scripts/compounding_bootstrap/`: scaffold / audit / proposal 引擎
- `docs/`: 规则层、架构层、流程层、AI operating model、重构计划
- `memory/`: 架构记忆、项目状态、运营蓝图、经验、ADR
- `code_index/`: 模块索引、依赖图、函数索引
- `tasks/`: 模板、队列、归档

## 核心模块域

### Studio 模块

- `apps/studio/src/modules/delivery`
- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/git-health`
- `apps/studio/src/modules/portal`
- `apps/studio/src/modules/releases`
- `apps/studio/src/modules/tasks`

### Bootstrap 引擎模块

- `scripts/compounding_bootstrap/audit.py`
- `scripts/compounding_bootstrap/catalog.py`
- `scripts/compounding_bootstrap/config_resolution.py`
- `scripts/compounding_bootstrap/defaults.py`
- `scripts/compounding_bootstrap/engine.py`
- `scripts/compounding_bootstrap/managed_blocks.py`
- `scripts/compounding_bootstrap/proposal_engine.py`
- `scripts/compounding_bootstrap/proposal_generation.py`
- `scripts/compounding_bootstrap/proposal_support.py`
- `scripts/compounding_bootstrap/renderers_base_docs.py`
- `scripts/compounding_bootstrap/renderers_experience_docs.py`
- `scripts/compounding_bootstrap/renderers_index.py`
- `scripts/compounding_bootstrap/renderers_refactor_docs.py`
- `scripts/compounding_bootstrap/repo_scan.py`
- `scripts/compounding_bootstrap/scaffold.py`
- `scripts/compounding_bootstrap/scaffold_assets.py`
- `scripts/compounding_bootstrap/yaml_io.py`

## 依赖方向

1. `AGENTS.md` 提供高频入口
2. `memory/project/roadmap.md` 提供战略层真相
3. `memory/project/operating-blueprint.md` 提供当前里程碑战术拆解
4. `tasks/*` 给出当前变更边界
5. `docs/*` 提供长期规则、架构和流程
6. `code_index/*` 提供上下文导航
7. 代码模块只依赖必要的邻近模块和共享基础层

## 生产发布运行时

- 运行根目录由 `AI_OS_RELEASE_ROOT` 决定；默认是仓库同级的 `.compounding-runtime`
- 目录约定固定为：
  - `releases/<release-id>/`
  - `current`
  - `shared/`
  - `registry.json`
- 新版本先在 `releases/<release-id>` 完成构建与 smoke check，再原子切换 `current`
- 本机或内网管理页通过 `apps/studio/src/modules/releases` 读取 registry，并触发 deploy / rollback

## 协作边界映射

- 工作模式的唯一真相源在 `docs/WORK_MODES.md`
- `AGENTS.md` 负责硬规则、门禁和执行契约
- `memory/project/*` 负责计划、状态与经验
- `tasks/*` 负责执行边界与交付合同
- `release` 负责验收、运行态与回滚事实
- 执行判断只看场景、状态、上下文、允许动作和验收标准，不按身份标签路由

## 当前重构批次

- 删除旧 workflow 前台和对应 API
- 把 Studio 收口为 `portal / docs / git-health`
- 把 bootstrap 引擎拆成可维护的 Python 微模块
- 补齐 `memory / tasks / code_index / scripts/ai` 骨架

## 禁止调用方式

- 禁止从 UI 组件跨层读取任意文件系统状态而不经过模块仓储层
- 禁止在 bootstrap 引擎里继续堆单一巨型 `engine.py`
- 禁止把临时上下文直接塞回 `AGENTS.md`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
