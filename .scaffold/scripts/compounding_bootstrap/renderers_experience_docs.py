from __future__ import annotations


def render_experience_readme() -> str:
    return """# 经验记录说明

这里记录尚未升格为长期规则的经验。默认先记忆，再验证，再决定是否升格。

## 记录格式

- 背景
- 决策
- 为什么
- 影响
- 复用

## 升格候选

- 重复出现 2 次以上且无明显例外的经验，才能候选升格
- 若现有规则已直接阻碍 roadmap 主线效率，可直接改规，但必须同步写 ADR
"""


def render_experience_entry(title: str, context: str, decision: str, why: str, impact: str, reuse: str) -> str:
    return f"""# {title}

## 背景

{context}

## 决策

{decision}

## 为什么

{why}

## 影响

{impact}

## 复用

{reuse}
"""


def render_adr(title: str, context: str, decision: str, consequences: str) -> str:
    return f"""# {title}

## 背景

{context}

## 决策

{decision}

## 影响结果

{consequences}
"""
