from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .defaults import CANONICAL_BLOCK_ID, MANAGED_FRONTMATTER_FIELDS
from .yaml_io import dump_simple_yaml, parse_simple_yaml


def split_frontmatter(raw: str) -> tuple[dict[str, Any], str]:
    if not raw.startswith("---\n"):
        return {}, raw
    try:
        _, rest = raw.split("---\n", 1)
        frontmatter_text, body = rest.split("\n---\n", 1)
    except ValueError:
        return {}, raw
    return parse_simple_yaml(frontmatter_text), body


def frontmatter_text(meta: dict[str, Any]) -> str:
    return f"---\n{dump_simple_yaml(meta)}\n---\n"


def extract_managed_block(body: str, block_id: str = CANONICAL_BLOCK_ID) -> str:
    pattern = re.compile(
        rf"<!-- BEGIN MANAGED BLOCK: {re.escape(block_id)} -->\n?([\s\S]*?)\n?<!-- END MANAGED BLOCK: {re.escape(block_id)} -->"
    )
    match = pattern.search(body)
    return match.group(1).strip() if match else ""


def replace_managed_block(body: str, block_content: str, block_id: str = CANONICAL_BLOCK_ID) -> str:
    rendered = (
        f"<!-- BEGIN MANAGED BLOCK: {block_id} -->\n"
        f"{block_content.strip()}\n"
        f"<!-- END MANAGED BLOCK: {block_id} -->"
    )
    pattern = re.compile(
        rf"<!-- BEGIN MANAGED BLOCK: {re.escape(block_id)} -->\n?[\s\S]*?\n?<!-- END MANAGED BLOCK: {re.escape(block_id)} -->"
    )
    if pattern.search(body):
        return pattern.sub(rendered, body, count=1)
    return f"{rendered}\n"


def suffix_after_managed_block(body: str, block_id: str = CANONICAL_BLOCK_ID) -> str:
    end_marker = f"<!-- END MANAGED BLOCK: {block_id} -->"
    if end_marker not in body:
        return ""
    suffix = body.split(end_marker, 1)[1]
    return suffix.lstrip("\n")


def body_without_suffix(body: str, block_id: str = CANONICAL_BLOCK_ID) -> str:
    end_marker = f"<!-- END MANAGED BLOCK: {block_id} -->"
    if end_marker not in body:
        return body
    prefix = body.split(end_marker, 1)[0]
    return f"{prefix}{end_marker}\n"


def build_document_text(
    existing_text: str | None,
    managed_meta: dict[str, Any],
    block_content: str,
    default_suffix: str = "",
    block_id: str = CANONICAL_BLOCK_ID,
) -> str:
    existing_meta, existing_body = split_frontmatter(existing_text or "")
    existing_block = extract_managed_block(existing_body, block_id)
    managed_changed = existing_block.strip() != block_content.strip()

    merged_meta = dict(existing_meta)
    for key in MANAGED_FRONTMATTER_FIELDS:
        if key == "last_reviewed_at":
            continue
        merged_meta[key] = managed_meta[key]
    if managed_changed or "last_reviewed_at" not in existing_meta:
        merged_meta["last_reviewed_at"] = datetime.now(timezone.utc).date().isoformat()
    else:
        merged_meta["last_reviewed_at"] = existing_meta["last_reviewed_at"]

    suffix = suffix_after_managed_block(existing_body, block_id) if existing_body else ""
    if not suffix.strip():
        suffix = default_suffix.strip()
    suffix = normalize_suffix(suffix, default_suffix)

    base_body = body_without_suffix(existing_body, block_id)
    rendered_body = replace_managed_block(base_body, block_content, block_id)
    if suffix:
        rendered_body = f"{rendered_body.rstrip()}\n\n{suffix.strip()}\n"
    else:
        rendered_body = f"{rendered_body.rstrip()}\n"
    return frontmatter_text(merged_meta) + rendered_body


def normalize_suffix(suffix: str, default_suffix: str) -> str:
    normalized = suffix.strip()
    default = default_suffix.strip()
    if not default or not normalized:
        return normalized
    lines = [line for line in normalized.splitlines() if line.strip()]
    default_lines = [line for line in default.splitlines() if line.strip()]
    if default_lines and len(lines) % len(default_lines) == 0 and lines == default_lines * (len(lines) // len(default_lines)):
        return default
    return normalized


def write_managed_document(
    path: Path,
    managed_meta: dict[str, Any],
    block_content: str,
    default_suffix: str = "",
    block_id: str = CANONICAL_BLOCK_ID,
) -> None:
    existing_text = path.read_text(encoding="utf8") if path.exists() else None
    final_text = build_document_text(existing_text, managed_meta, block_content, default_suffix, block_id)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(final_text, encoding="utf8")


def update_existing_document_block(path: Path, block_content: str, block_id: str = CANONICAL_BLOCK_ID) -> None:
    existing_text = path.read_text(encoding="utf8")
    meta, body = split_frontmatter(existing_text)
    updated_body = replace_managed_block(body, block_content, block_id)
    path.write_text(frontmatter_text(meta) + updated_body, encoding="utf8")
