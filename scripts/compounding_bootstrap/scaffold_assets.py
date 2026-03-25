from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any

from .defaults import AGENTS_PATH
from .managed_blocks import extract_managed_block, split_frontmatter, suffix_after_managed_block, write_managed_document

SOURCE_ROOT = Path(__file__).resolve().parents[2]


def copy_canonical_file(target: Path, relative_path: str) -> None:
    source = SOURCE_ROOT / relative_path
    destination = target / relative_path
    if source.resolve() == destination.resolve():
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)


def sync_canonical_managed_document(target: Path, relative_path: str) -> None:
    source = SOURCE_ROOT / relative_path
    destination = target / relative_path
    raw = source.read_text(encoding="utf8")
    meta, body = split_frontmatter(raw)
    block = extract_managed_block(body)
    suffix = suffix_after_managed_block(body)
    write_managed_document(destination, meta, block, default_suffix=suffix)


def task_001(resolved: dict[str, Any]) -> str:
    return f"""# task-001-repo-refactor

## 任务摘要

- 短编号：`t-001`
- 父计划：`memory/project/operating-blueprint.md`
- 任务摘要：
  把当前仓库升级成真正可持续的 AI-Native Repo，并补齐后台准备版本、原子切换和快速回滚的第一版骨架。
- 为什么现在：
  当前仓库仍残留旧 workflow 前台、旧 docs 体系和巨型 bootstrap 引擎，不利于 AI 长期协作和多 agent 并行。
- 承接边界：
  从早期单仓重构计划中承接“搭起规则层、记忆层、索引层、任务层和本地发布骨架”这一段。
- 完成定义：
  规则层、记忆层、上下文层和第一版本地发布骨架可用，旧 workflow 前台退出默认构建入口。

## 执行合同

### 要做

- 建立 docs / memory / code_index / tasks / scripts/ai 骨架
- 收敛 Studio 到只读门户
- 拆分 bootstrap 引擎的第一批模块
- 显式记录技术债和 ADR
- 建立 release registry、部署脚本、本机管理页和回滚入口

### 不做

- 大面积业务逻辑重写
- 恢复多步骤 workflow 前台
- 引入数据库、复杂编排层或多机发布系统

### 约束

- 不过度工程
- 新增代码必须伴随清理
- 改动前先过 preflight
- 关键行为保持稳定

### 关键风险

- bootstrap 行为回归
- 文档结构切换导致旧路径失效
- 索引脚本第一版准确度有限
- 单机发布模型仍依赖真实环境验证

### 测试策略

- 为什么测：
  这是仓库骨架级改动，必须锁住构建、测试与 scaffold 审计。
- 测什么：
  `pnpm build`、`pnpm test`、`bootstrap:audit` 与本地发布骨架是否可用。
- 不测什么：
  不为每个骨架文件单独补细粒度快照测试。
- 当前最小集理由：
  先保护能否稳定构建、测试和发布，不把初期骨架阶段变成过度测试工程。

## 交付结果

- 状态：done
- 体验验收结果：
  仓库结构、门户入口和本地发布骨架均已可用。
- 交付结果：
  AI-Native Repo 的第一版执行骨架已经成型。
- 复盘：
  这轮任务的主要价值是搭起 AI-Native Repo 骨架；后续具体收口由后续 task 逐步接手。
"""


def render_ai_scripts(target: Path) -> None:
    for relative_path in (
        "shared/module-feature-contract.ts",
        "shared/feature-context.ts",
        "scripts/ai/lib/task-template.js",
        "scripts/ai/lib/knowledge-assets.ts",
        "scripts/ai/lib/knowledge-asset-health.ts",
        "scripts/ai/lib/cleanup-candidates.ts",
        "scripts/ai/lib/feature-context.ts",
        "scripts/ai/scan-code-health.ts",
        "scripts/ai/cleanup-candidates.ts",
        "scripts/ai/generate-code-volume.ts",
        "scripts/ai/generate-asset-maintenance.ts",
        "scripts/ai/generate-module-index.ts",
        "scripts/ai/build-context.ts",
        "scripts/ai/feature-context.ts",
        "scripts/ai/create-task.ts",
        "scripts/ai/validate-change-trace.ts",
        "scripts/ai/validate-knowledge-assets.ts",
        "scripts/ai/validate-task-git-link.ts",
    ):
        copy_canonical_file(target, relative_path)


def render_pull_request_template(target: Path) -> None:
    copy_canonical_file(target, ".github/pull_request_template.md")


def render_task_template(target: Path) -> None:
    copy_canonical_file(target, "tasks/templates/task-template.md")


def render_prompt_docs(target: Path) -> None:
    for relative_path in (
        "docs/prompts/ai-doc-rewrite-system.md",
        "docs/prompts/ai-doc-clarify-user.md",
        "docs/prompts/ai-doc-rewrite-user.md",
    ):
        copy_canonical_file(target, relative_path)


def render_manifest(target: Path) -> None:
    manifest = {
        "core_docs": [
            AGENTS_PATH,
            "docs/WORK_MODES.md",
            "docs/DEV_WORKFLOW.md",
            "docs/ARCHITECTURE.md",
            "memory/project/roadmap.md",
            "memory/project/current-state.md",
            "memory/project/operating-blueprint.md",
        ],
        "appendix_docs": [
            "docs/PROJECT_RULES.md",
            "docs/AI_OPERATING_MODEL.md",
            "docs/ASSET_MAINTENANCE.md",
            "docs/prompts/ai-doc-rewrite-system.md",
            "docs/prompts/ai-doc-clarify-user.md",
            "docs/prompts/ai-doc-rewrite-user.md",
            "memory/project/tech-debt.md",
            "code_index/module-index.md",
            "code_index/dependency-map.md",
            "tasks/templates/task-template.md",
            "tasks/queue/task-001-repo-refactor.md",
        ]
    }
    manifest_path = target / "bootstrap" / "templates" / "document_manifest.json"
    if manifest_path.exists():
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
