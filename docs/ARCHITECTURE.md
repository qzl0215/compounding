---
title: ARCHITECTURE
update_mode: promote_only
status: active
last_reviewed_at: 2026-03-29
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - code_index/module-index.md
  - memory/architecture/system-overview.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 架构

## 仓库结构

- `apps/studio/`: 只读门户与读模型投影层
- `scripts/ai/`: 上下文构建、索引生成、任务创建、验证门禁
- `scripts/coord/`: companion、pre-task、review / handoff 护栏
- `scripts/compounding_bootstrap/`: scaffold / audit / proposal 引擎
- `docs/`: 4 文档主干 + 专项附录
- `memory/`: 项目状态、架构记忆、经验、ADR
- `code_index/`: 生成型导航缓存
- `tasks/`: 模板与任务队列

## 分类清单

以下清单按当前 truth split 固定分层，只列仓库级文件族，不把 `.next`、`node_modules`、`output` 之类派生物当主源。

- core：`apps/studio/src/app/*`、`apps/studio/src/components/*`、`apps/studio/src/lib/*`、`apps/studio/src/modules/*`、`scripts/ai/*`、`scripts/coord/*`、`scripts/local-runtime/*`、`scripts/release/*`、`shared/*`
- bootstrap：`scripts/compounding_bootstrap/*`、`scripts/init_project_compounding.py`、`kernel/kernel_manifest.yaml`、`bootstrap/*`、`schemas/*`、`templates/*`
- config：`package.json`、`pnpm-workspace.yaml`、`apps/studio/*.config.*`、`.github/*`、`.cursor/rules/*`、`CLAUDE.md`、`OPENCODE.md`、`docs/OPERATOR_RUNBOOK.md`
- governance / knowledge：`AGENTS.md`、`docs/*`、`memory/*`、`tasks/*`、`code_index/*`
- derived / runtime：`output/*`、`.compounding-runtime/*`、`.next/*`、`node_modules/*`

### Core

- `apps/studio/src/app/**`
- `apps/studio/src/components/**`
- `apps/studio/src/lib/**`
- `apps/studio/src/modules/**`（delivery / docs / git-health / portal / project-state / releases / tasks）
- `scripts/ai/**`
- `scripts/coord/**`
- `scripts/local-runtime/**`
- `scripts/release/**`
- `shared/**`

### Bootstrap

- `scripts/compounding_bootstrap/**`
- `scripts/init_project_compounding.py`
- `kernel/kernel_manifest.yaml`
- `bootstrap/project_bootstrap.yaml`
- `bootstrap/project_brief.yaml`
- `bootstrap/project_operator.yaml`
- `bootstrap/canonical_hardening.json`
- `bootstrap/heading_aliases.json`
- `bootstrap/managed_blocks/**`
- `bootstrap/schemas/**`
- `bootstrap/templates/**`
- `schemas/**`
- `templates/**`
- `tasks/templates/task-template.md`

### Config / 入口契约

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `apps/studio/package.json`
- `apps/studio/tsconfig.json`
- `apps/studio/next.config.ts`
- `apps/studio/eslint.config.mjs`
- `apps/studio/tailwind.config.ts`
- `apps/studio/postcss.config.mjs`
- `apps/studio/vitest.config.ts`
- `apps/studio/vitest.setup.ts`
- `apps/studio/next-env.d.ts`
- `.github/**`
- `.cursor/rules/**`
- `CLAUDE.md`
- `OPENCODE.md`
- `docs/OPERATOR_RUNBOOK.md`

### 治理 / 知识主源

- `AGENTS.md`
- `docs/WORK_MODES.md`
- `docs/DEV_WORKFLOW.md`
- `docs/ARCHITECTURE.md`
- `docs/PROJECT_RULES.md`
- `docs/AI_OPERATING_MODEL.md`
- `docs/ASSET_MAINTENANCE.md`
- `docs/prompts/**`
- `memory/**`
- `tasks/queue/**`
- `code_index/**`
- `README.md`

### 派生物 / 运行态

- `.compounding-runtime/**`
- `output/**`
- `.next/**`
- `.pytest_cache/**`
- `node_modules/**`

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
- `scripts/compounding_bootstrap/repo_scan.py`
- `scripts/compounding_bootstrap/scaffold.py`
- `scripts/compounding_bootstrap/scaffold_assets.py`
- `scripts/compounding_bootstrap/yaml_io.py`

## 依赖方向

- `apps/studio/src/app/*` 只通过 `apps/studio/src/modules/*` 读取文件与投影事实。
- `apps/studio/src/modules/*` 只依赖必要的邻近模块 public API 和共享解析层，不跨层读任意文件系统状态。
- `scripts/ai/*` 与 `scripts/coord/*` 可以读取 `docs / memory / tasks / code_index`，但不把运行期临时事实回写成新的真相源。
- `scripts/compounding_bootstrap/*` 只依赖 bootstrap 内部模块和 canonical assets，不继续堆单一巨型入口。
- `code_index/*`、`docs/ASSET_MAINTENANCE.md`、代码量快照等生成物都是下游缓存，不反向充当主真相源。

## 运行时拓扑

- 运行根目录由 `AI_OS_RELEASE_ROOT` 决定；默认是仓库同级的 `.compounding-runtime`
- 目录约定固定为：
  - `releases/<release-id>/`
  - `current`
  - `shared/`
  - `registry.json`
- 新版本先在 `releases/<release-id>` 完成构建与 smoke check，再原子切换 `current`
- 本机或内网管理页通过 `apps/studio/src/modules/releases` 读取 registry，并触发 deploy / rollback

## 模块边界

- `TaskContract` 只保留人类执行语义；branch、commit、release、trace 等机器事实由 companion / release 投影承接。
- 首页读取 `HomeLogicMapSnapshot`，任务页与发布页继续读取各自投影；不再让首页承接旧 `Kernel / Project` 工程视角。
- 文档与记忆主源保留人工维护；生成脚本只负责缓存、注册表和导航索引。

## 禁止调用方式

- 禁止从 UI 组件跨层读取任意文件系统状态而不经过模块仓储层
- 禁止在 bootstrap 引擎里继续堆单一巨型 `engine.py`
- 禁止把临时上下文直接塞回 `AGENTS.md`
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
