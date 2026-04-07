# 简化目标层：统一 Goal 单一主源

## 短编号

t-100

## 父计划

`memory/project/goals.md`

## 任务摘要

简化目标层，将 `roadmap.md`、`operating-blueprint.md`、`governance-gaps.md` 统一为 `goals.md` 单一主源。

## 为什么现在

目标层原本散落在 roadmap/operating-blueprint/governance-gaps 三处，内容重叠且无统一主入口；Goal = Goal - Current 的闭环已清晰，gap 不再需要独立步骤。

## 承接边界

历史任务，仅保留原始决策与复盘，不再扩展。

## 要做

- 新建 `memory/project/goals.md` 作为 Goal 单一主源
- 删除 roadmap.md、operating-blueprint.md、governance-gaps.md
- 更新所有引用上述文件的代码和配置
- 同步 ASSET_MAINTENANCE.md

## 不做

- 不改动 goals.md 的实际内容（内容填充是后续工作）
- 不改动 governance guard 的断言矩阵结构
- 不改动 task 系统的其他部分

## 完成定义

- `memory/project/goals.md` 存在且内容完整
- `roadmap.md`, `operating-blueprint.md`, `governance-gaps.md` 已删除
- `pnpm preflight` 通过
- `pnpm validate:static` 通过
- `pnpm build` 通过

## 关键风险

低；只做文件替换，不涉及运行时逻辑。

## 测试策略

治理 gap 相关测试需要更新以反映文件删除。验证 test_ai_assets_cli.py、test_coord_cli.py 中 governance gaps 相关用例。

## 状态

done

## 交付结果

统一 Goal 单一主源，删除 roadmap/blueprint/governance-gaps，goals.md 现包含 True North、Hard Constraints、This Phase Success、Not Goal 和演进脉络。

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

## 背景

根据 harness-engineering-vision，闭环简化为：

```
Goal → Current → Plan → Task → Review → Release → Memory → 循环
```

**Gap 不再是独立步骤** — Gap = Goal - Current，差是客观存在的，不需要专门识别。
