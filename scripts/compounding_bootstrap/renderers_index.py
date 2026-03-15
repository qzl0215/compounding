from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


def render_module_index(scan: dict[str, Any]) -> str:
    studio_modules = scan.get("studio_modules") or ["portal", "docs", "git-health"]
    bootstrap_modules = scan.get("bootstrap_modules") or [
        "defaults",
        "config_resolution",
        "managed_blocks",
        "document_renderers",
        "scaffold",
        "audit",
        "proposal_engine",
        "engine",
    ]
    lines = ["# 模块索引", "", "## Studio 模块", ""]
    lines.extend(f"- `{name}`: Studio 一等模块" for name in studio_modules)
    lines.extend(["", "## Bootstrap 引擎模块", ""])
    lines.extend(f"- `{name}`: bootstrap 引擎模块" for name in bootstrap_modules)
    lines.extend(["", "## 修改前先读", "", "- 先读对应 `module.md`", "- 再读相关 task / docs / memory / code_index", ""])
    return "\n".join(lines)


def render_dependency_map() -> str:
    return """# 依赖图

## 允许的依赖方向

- `AGENTS.md` -> `docs/*` -> `tasks/*` -> `code_index/*` -> code
- `apps/studio/src/app/*` -> `apps/studio/src/modules/*` -> `components/ui/*` / `lib/workspace.ts`
- `scripts/init_project_compounding.py` -> `scripts/compounding_bootstrap/engine.py` -> split modules
- `scripts/ai/*` -> filesystem / JSON / markdown outputs

## 禁止的依赖方向

- app 层直接读取任意仓库文件而绕过模块仓储层
- 模块之间跨层访问私有实现
- 任务、记忆、索引互相覆盖职责
"""


def render_function_index(target: Path) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    ts_roots = [
        target / "apps/studio/src/modules",
        target / "scripts/ai",
    ]
    py_root = target / "scripts/compounding_bootstrap"
    ts_pattern = re.compile(r"export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)|function\s+([A-Za-z0-9_]+)")
    py_pattern = re.compile(r"^def\s+([A-Za-z0-9_]+)\s*\(", re.MULTILINE)

    for root in ts_roots:
        if not root.exists():
            continue
        for path in root.rglob("*.ts*"):
            if path.name.endswith(".test.ts") or "__tests__" in path.parts:
                continue
            text = path.read_text(encoding="utf8", errors="ignore")
            module = path.relative_to(target).as_posix().rsplit("/", 1)[0]
            for match in ts_pattern.finditer(text):
                symbol = match.group(1) or match.group(2)
                if not symbol:
                    continue
                entries.append(
                    {
                        "module": module,
                        "file": path.relative_to(target).as_posix(),
                        "symbol": symbol,
                        "kind": "function",
                        "language": "TypeScript",
                        "exported": bool(match.group(1)),
                    }
                )

    if py_root.exists():
        for path in py_root.rglob("*.py"):
            if path.name == "__init__.py":
                continue
            text = path.read_text(encoding="utf8", errors="ignore")
            module = path.relative_to(target).as_posix().rsplit("/", 1)[0]
            for match in py_pattern.finditer(text):
                entries.append(
                    {
                        "module": module,
                        "file": path.relative_to(target).as_posix(),
                        "symbol": match.group(1),
                        "kind": "function",
                        "language": "Python",
                        "exported": not match.group(1).startswith("_"),
                    }
                )
    return entries


def render_function_index_json(target: Path) -> str:
    return json.dumps(render_function_index(target), indent=2, ensure_ascii=False) + "\n"
