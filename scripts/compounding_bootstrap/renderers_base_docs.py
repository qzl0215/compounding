from __future__ import annotations


def bullet_list(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items)


def evidence_boundary_block() -> str:
    return ""


def render_readme(_: dict[str, object]) -> str:
    return """# 仓库说明

这是一个面向 AI 长期协作的 AI-Native Repo。默认先读 `AGENTS.md`，再按需进入 `docs/*`、`memory/*`、`code_index/*` 和 `tasks/*`。
"""
