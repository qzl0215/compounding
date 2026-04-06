---
title: 简化目标层：统一 Goal 单一主源
task_id: task-100
type: structural
status: in_progress
created_by: qzl0215
created_at: 2026-04-06
linked_gap: null
from_assertion: null
writeback_targets: []
---

## 任务摘要

简化目标层，将 `roadmap.md`、`operating-blueprint.md`、`governance-gaps.md` 统一为 `goals.md` 单一主源。

## 背景

根据 harness-engineering-vision，闭环简化为：

```
Goal → Current → Plan → Task → Review → Release → Memory → 循环
```

**Gap 不再是独立步骤** — Gap = Goal - Current，差是客观存在的，不需要专门识别。

## 改动范围

### 1. 新建 Goals 单一主源

- `memory/project/goals.md` 已创建

### 2. 删除的文档

- `memory/project/roadmap.md`
- `memory/project/operating-blueprint.md`
- `memory/project/governance-gaps.md`

### 3. 核心代码更新

- `shared/project-judgement.ts` - 移除 roadmap/blueprint 读取依赖
- `shared/project-judgement-live.ts` - 移除 roadmap/blueprint 读取

### 4. Bootstrap 更新

- `scripts/compounding_bootstrap/bootstrap.py` - 移除 roadmap/blueprint 生成
- `scripts/compounding_bootstrap/defaults.py` - 更新 MINIMAL_MEMORY_DOCS
- `scripts/compounding_bootstrap/catalog.py` - 更新 MEMORY_DOCS
- `scripts/compounding_bootstrap/config_resolution.py` - 更新路径常量
- `scripts/compounding_bootstrap/attach.py` - 更新协议检测
- `scripts/compounding_bootstrap/audit.py` - 更新必需协议列表

### 5. 模板更新

- `bootstrap/project_brief.yaml`
- `bootstrap/templates/document_manifest.json`
- `bootstrap/templates/foreman_bootstrap.md.tmpl`
- `templates/project_brief.template.yaml`
- `kernel/kernel_manifest.yaml`

### 6. AGENTS.md 更新

- 默认读链中移除 roadmap.md / operating-blueprint.md
- 增加 goals.md 引用

## 关联模块

- `AGENTS.md`
- `bootstrap/project_brief.yaml`
- `bootstrap/templates/document_manifest.json`
- `bootstrap/templates/foreman_bootstrap.md.tmpl`
- `kernel/kernel_manifest.yaml`
- `memory/project/goals.md`
- `memory/project/roadmap.md` (删除)
- `memory/project/operating-blueprint.md` (删除)
- `memory/project/governance-gaps.md` (删除)
- `scripts/ai/lib/governance-guard-contract.ts`
- `scripts/ai/lib/knowledge-assets.ts`
- `scripts/ai/validate-governance-guards.ts`
- `scripts/compounding_bootstrap/attach.py`
- `scripts/compounding_bootstrap/audit.py`
- `scripts/compounding_bootstrap/bootstrap.py`
- `scripts/compounding_bootstrap/catalog.py`
- `scripts/compounding_bootstrap/config_resolution.py`
- `scripts/compounding_bootstrap/defaults.py`
- `shared/project-judgement.ts`
- `shared/project-judgement-live.ts`
- `templates/project_brief.template.yaml`

## 完成定义

- `memory/project/goals.md` 存在且内容完整
- `roadmap.md`, `operating-blueprint.md`, `governance-gaps.md` 已删除
- `pnpm preflight` 通过
- `pnpm validate:static` 通过
- `pnpm build` 通过
