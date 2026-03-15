from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def parse_scalar(value: str) -> Any:
    text = value.strip()
    if text in {"true", "false"}:
        return text == "true"
    if text.isdigit():
        return int(text)
    if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
        return text[1:-1]
    return text


def parse_simple_yaml(text: str) -> dict[str, Any]:
    lines = text.splitlines()
    root: dict[str, Any] = {}
    current_key: str | None = None
    current_subkey: str | None = None

    for raw in lines:
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        line = raw.strip()
        if indent == 0:
            current_subkey = None
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip()
            current_key = key
            root[key] = parse_scalar(value) if value else None
            continue
        if current_key is None:
            continue
        if line.startswith("- "):
            item = parse_scalar(line[2:].strip())
            if current_subkey and isinstance(root.get(current_key), dict):
                nested = root[current_key].setdefault(current_subkey, [])
                if isinstance(nested, list):
                    nested.append(item)
            else:
                items = root.setdefault(current_key, [])
                if not isinstance(items, list):
                    items = []
                    root[current_key] = items
                items.append(item)
            continue
        key, _, value = line.partition(":")
        key = key.strip()
        value = value.strip()
        mapping = root.setdefault(current_key, {})
        if not isinstance(mapping, dict):
            mapping = {}
            root[current_key] = mapping
        current_subkey = key
        mapping[key] = parse_scalar(value) if value else []
    return root


def format_scalar(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return '""'
    text = str(value)
    if any(char in text for char in [":", "#"]) or text.startswith("{") or text.endswith("}") or text.strip() != text:
        return json.dumps(text, ensure_ascii=False)
    return text


def dump_simple_yaml(value: Any, indent: int = 0) -> str:
    prefix = " " * indent
    if isinstance(value, dict):
        lines: list[str] = []
        for key, item in value.items():
            if isinstance(item, (dict, list)):
                lines.append(f"{prefix}{key}:")
                lines.append(dump_simple_yaml(item, indent + 2))
            else:
                lines.append(f"{prefix}{key}: {format_scalar(item)}")
        return "\n".join(lines)
    if isinstance(value, list):
        lines = []
        for item in value:
            if isinstance(item, dict):
                first = True
                for key, nested in item.items():
                    lines.append(
                        f"{prefix}{'- ' if first else '  '}{key}:"
                        + (f" {format_scalar(nested)}" if not isinstance(nested, (dict, list)) else "")
                    )
                    if isinstance(nested, (dict, list)):
                        lines.append(dump_simple_yaml(nested, indent + 4))
                    first = False
                if first:
                    lines.append(f"{prefix}- {{}}")
            elif isinstance(item, list):
                lines.append(f"{prefix}-")
                lines.append(dump_simple_yaml(item, indent + 2))
            else:
                lines.append(f"{prefix}- {format_scalar(item)}")
        return "\n".join(lines)
    return f"{prefix}{format_scalar(value)}"


def load_yaml(path: Path) -> dict[str, Any]:
    return parse_simple_yaml(path.read_text(encoding="utf8"))


def save_yaml(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(dump_simple_yaml(payload) + "\n", encoding="utf8")
