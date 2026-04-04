from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class YamlLine:
    indent: int
    content: str


def split_inline_items(text: str) -> list[str]:
    items: list[str] = []
    current: list[str] = []
    quote: str | None = None
    depth = 0
    for char in text:
        if quote:
            current.append(char)
            if char == quote:
                quote = None
            continue
        if char in {'"', "'"}:
            quote = char
            current.append(char)
            continue
        if char in "[{":
            depth += 1
            current.append(char)
            continue
        if char in "]}":
            depth = max(0, depth - 1)
            current.append(char)
            continue
        if char == "," and depth == 0:
            items.append("".join(current).strip())
            current = []
            continue
        current.append(char)
    tail = "".join(current).strip()
    if tail:
        items.append(tail)
    return items


def parse_scalar(value: str) -> Any:
    text = value.strip()
    if text == "":
        return ""
    if text in {"true", "false"}:
        return text == "true"
    if text in {"null", "~"}:
        return None
    if text == "[]":
        return []
    if text == "{}":
        return {}
    if text.startswith("[") and text.endswith("]"):
        inner = text[1:-1].strip()
        if not inner:
            return []
        return [parse_scalar(item) for item in split_inline_items(inner)]
    if text.startswith("{") and text.endswith("}"):
        inner = text[1:-1].strip()
        if not inner:
            return {}
        result: dict[str, Any] = {}
        for item in split_inline_items(inner):
            key, _, raw = item.partition(":")
            result[key.strip()] = parse_scalar(raw)
        return result
    if text.isdigit() or (text.startswith("-") and text[1:].isdigit()):
        return int(text)
    if text.count(".") == 1 and text.replace(".", "", 1).isdigit():
        return float(text)
    if (text.startswith('"') and text.endswith('"')) or (text.startswith("'") and text.endswith("'")):
        if text.startswith('"'):
            return json.loads(text)
        return text[1:-1]
    return text


def normalize_lines(text: str) -> list[YamlLine]:
    lines: list[YamlLine] = []
    for raw in text.splitlines():
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            continue
        indent = len(raw) - len(raw.lstrip(" "))
        lines.append(YamlLine(indent=indent, content=stripped))
    return lines


def parse_block(lines: list[YamlLine], index: int, indent: int) -> tuple[Any, int]:
    if index >= len(lines):
        return {}, index
    if lines[index].content.startswith("-"):
        return parse_list(lines, index, indent)
    return parse_mapping(lines, index, indent)


def parse_mapping(lines: list[YamlLine], index: int, indent: int) -> tuple[dict[str, Any], int]:
    result: dict[str, Any] = {}
    cursor = index
    while cursor < len(lines):
        line = lines[cursor]
        if line.indent < indent:
            break
        if line.indent != indent or line.content.startswith("-"):
            break
        key, _, remainder = line.content.partition(":")
        if not _:
            raise ValueError(f"Invalid YAML mapping line: {line.content}")
        key = key.strip()
        remainder = remainder.lstrip()
        cursor += 1
        if remainder == "":
            if cursor < len(lines) and lines[cursor].indent > indent:
                child, cursor = parse_block(lines, cursor, lines[cursor].indent)
                result[key] = child
            else:
                result[key] = None
            continue
        result[key] = parse_scalar(remainder)
    return result, cursor


def parse_list(lines: list[YamlLine], index: int, indent: int) -> tuple[list[Any], int]:
    result: list[Any] = []
    cursor = index
    while cursor < len(lines):
        line = lines[cursor]
        if line.indent < indent:
            break
        if line.indent != indent or not line.content.startswith("-"):
            break
        remainder = line.content[1:].lstrip()
        cursor += 1
        if remainder == "":
            if cursor < len(lines) and lines[cursor].indent > indent:
                child, cursor = parse_block(lines, cursor, lines[cursor].indent)
                result.append(child)
            else:
                result.append(None)
            continue
        if (remainder.startswith('"') and remainder.endswith('"')) or (
            remainder.startswith("'") and remainder.endswith("'")
        ):
            result.append(parse_scalar(remainder))
            continue
        if ":" in remainder:
            key, _, inline_value = remainder.partition(":")
            item: dict[str, Any] = {}
            inline_value = inline_value.lstrip()
            if inline_value == "":
                if cursor < len(lines) and lines[cursor].indent > indent:
                    child, cursor = parse_block(lines, cursor, lines[cursor].indent)
                    item[key.strip()] = child
                else:
                    item[key.strip()] = None
            else:
                item[key.strip()] = parse_scalar(inline_value)
            if cursor < len(lines) and lines[cursor].indent > indent:
                extra, cursor = parse_mapping(lines, cursor, lines[cursor].indent)
                item.update(extra)
            result.append(item)
            continue
        result.append(parse_scalar(remainder))
    return result, cursor


def parse_simple_yaml(text: str) -> Any:
    lines = normalize_lines(text)
    if not lines:
        return {}
    payload, _ = parse_block(lines, 0, lines[0].indent)
    return payload


def needs_quotes(text: str) -> bool:
    if text == "" or text.strip() != text:
        return True
    if text in {"true", "false", "null", "~", "[]", "{}"}:
        return True
    if text.isdigit() or (text.startswith("-") and text[1:].isdigit()):
        return True
    if text.count(".") == 1 and text.replace(".", "", 1).isdigit():
        return True
    if text[0] in {"-", "*", "?", "!", "&", "@", "[", "]", "{", "}"}:
        return True
    return any(char in text for char in [":", "#", ","])


def format_scalar(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value)
    if needs_quotes(text):
        return json.dumps(text, ensure_ascii=False)
    return text


def dump_simple_yaml(value: Any, indent: int = 0) -> str:
    prefix = " " * indent
    if isinstance(value, dict):
        if not value:
            return f"{prefix}{{}}"
        lines: list[str] = []
        for key, item in value.items():
            if isinstance(item, dict):
                if item:
                    lines.append(f"{prefix}{key}:")
                    lines.append(dump_simple_yaml(item, indent + 2))
                else:
                    lines.append(f"{prefix}{key}: {{}}")
            elif isinstance(item, list):
                if item:
                    lines.append(f"{prefix}{key}:")
                    lines.append(dump_simple_yaml(item, indent + 2))
                else:
                    lines.append(f"{prefix}{key}: []")
            else:
                lines.append(f"{prefix}{key}: {format_scalar(item)}")
        return "\n".join(lines)
    if isinstance(value, list):
        if not value:
            return f"{prefix}[]"
        lines: list[str] = []
        for item in value:
            if isinstance(item, dict):
                if not item:
                    lines.append(f"{prefix}- {{}}")
                    continue
                entries = list(item.items())
                for index, (key, nested) in enumerate(entries):
                    item_prefix = f"{prefix}- " if index == 0 else f"{prefix}  "
                    if isinstance(nested, dict):
                        if nested:
                            lines.append(f"{item_prefix}{key}:")
                            lines.append(dump_simple_yaml(nested, indent + 4))
                        else:
                            lines.append(f"{item_prefix}{key}: {{}}")
                    elif isinstance(nested, list):
                        if nested:
                            lines.append(f"{item_prefix}{key}:")
                            lines.append(dump_simple_yaml(nested, indent + 4))
                        else:
                            lines.append(f"{item_prefix}{key}: []")
                    else:
                        lines.append(f"{item_prefix}{key}: {format_scalar(nested)}")
                continue
            if isinstance(item, list):
                lines.append(f"{prefix}-")
                lines.append(dump_simple_yaml(item, indent + 2))
                continue
            lines.append(f"{prefix}- {format_scalar(item)}")
        return "\n".join(lines)
    return f"{prefix}{format_scalar(value)}"


def load_yaml(path: Path) -> Any:
    return parse_simple_yaml(path.read_text(encoding="utf8"))


def save_yaml(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(dump_simple_yaml(payload) + "\n", encoding="utf8")
