from __future__ import annotations

from typing import Any

from .renderers_base_docs import bullet_list, evidence_boundary_block


def render_refactor_plan(resolved: dict[str, Any]) -> str:
    largest = resolved["repo_scan"].get("largest_files", [])
    largest_section = bullet_list([f"`{path}`: {lines} LOC" for lines, path in largest]) or "- 当前扫描暂无数据"
    return f"""# 重构计划

## 当前问题总览

- 当前仓库历史上混合了 bootstrap 产品、文档操作系统和半退役 workflow 前台
- 旧 docs 体系、旧 API、旧组件仍对 AI 理解造成噪声
- bootstrap 引擎曾长期集中在单一巨型文件中
- 缺少面向 AI 的 task / memory / code_index 闭环
- 文档标题和 task 可视化仍不够中文友好、不够直观

## 最值得优先处理的 10 个问题

1. `AGENTS.md` 必须从长文主源收口为薄入口 bootloader
2. 旧的分层 docs 子树已经不应继续作为 live docs 使用，必须全部归档隔离
3. `scripts/compounding_bootstrap/engine.py` 过大，妨碍维护和并行修改
4. Studio 旧 workflow 页面和 API 已失效但仍残留
5. 任务系统缺失，AI 改动难以绑定明确 scope
6. 项目记忆层和 ADR 没有清晰归宿
7. code index 缺失，AI 每次都要重新摸索模块入口
8. 巨型 util / helper 扩张缺少明确治理阈值
9. 生产发布还缺少后台准备 + 原子切换 + rollback registry
10. 中文化和任务可视化仍不足以支撑高效组织

## 目标结构

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
├─ scripts/release/
└─ apps/studio/src/modules/
```

## 大文件快照

{largest_section}

## 第一批建议拆分的模块

- `apps/studio/src/modules/docs`
- `apps/studio/src/modules/portal`
- `apps/studio/src/modules/git-health`
- `apps/studio/src/modules/releases`
- `scripts/compounding_bootstrap/*`

## 高风险点

- 改文档结构时容易产生平行主源
- bootstrap 行为改动必须保持 scaffold / audit / propose / apply 对外接口稳定
- 删除旧前台时必须确保 `/`、`/knowledge-base`、`/releases` 仍能正常构建
- 发布与回滚脚本必须做到“失败不切流”，不能破坏当前线上版本

## 本次重构边界

- 本轮以结构升级为主，不做大面积业务重写
- 允许真实删除旧页面、旧 API、旧组件和重复逻辑
- 允许直接更新规范，只要它们正在限制当前主线效率

{evidence_boundary_block()}
"""
