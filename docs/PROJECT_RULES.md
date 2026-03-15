---
title: PROJECT_RULES
doc_role: reference
update_mode: promote_only
owner_role: Architect
status: active
last_reviewed_at: 2026-03-15
source_of_truth: AGENTS.md
related_docs:
  - AGENTS.md
  - docs/ARCHITECTURE.md
  - memory/project/tech-debt.md
---
<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->
# 项目规则

## 目标

这份文档定义当前仓库的代码治理规则。目标不是增加流程，而是降低 AI 理解成本、降低重复逻辑和隐式依赖、稳定支撑多 agent 并行。

## 文件体量限制

- TypeScript / TSX / Python 文件软上限：250 LOC
- TypeScript / TSX / Python 文件硬上限：400 LOC
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

## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界：
<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->
