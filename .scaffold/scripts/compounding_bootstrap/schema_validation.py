from __future__ import annotations

from pathlib import Path
from typing import Any

from .yaml_io import load_yaml


def load_schema(path: Path) -> dict[str, Any]:
    payload = load_yaml(path)
    if not isinstance(payload, dict):
        raise ValueError(f"Schema must be a mapping: {path}")
    return payload


def validate_payload(payload: Any, schema: dict[str, Any], pointer: str = "root") -> list[str]:
    errors: list[str] = []
    expected_type = schema.get("type")
    if expected_type == "object":
        if not isinstance(payload, dict):
            return [f"{pointer}: expected object"]
        required = schema.get("required") or []
        for field in required:
            if field not in payload:
                errors.append(f"{pointer}.{field}: missing required field")
        properties = schema.get("properties") or {}
        for key, value in payload.items():
            if key in properties:
                errors.extend(validate_payload(value, properties[key], f"{pointer}.{key}"))
        return errors
    if expected_type == "array":
        if not isinstance(payload, list):
            return [f"{pointer}: expected array"]
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for index, item in enumerate(payload):
                errors.extend(validate_payload(item, item_schema, f"{pointer}[{index}]"))
        return errors
    if expected_type == "string":
        if not isinstance(payload, str):
            return [f"{pointer}: expected string"]
    elif expected_type == "integer":
        if not isinstance(payload, int) or isinstance(payload, bool):
            return [f"{pointer}: expected integer"]
    elif expected_type == "number":
        if not isinstance(payload, (int, float)) or isinstance(payload, bool):
            return [f"{pointer}: expected number"]
    elif expected_type == "boolean":
        if not isinstance(payload, bool):
            return [f"{pointer}: expected boolean"]

    enum = schema.get("enum")
    if enum and payload not in enum:
        errors.append(f"{pointer}: expected one of {', '.join(str(item) for item in enum)}")
    return errors


def validate_file(path: Path, schema_path: Path) -> list[str]:
    payload = load_yaml(path)
    schema = load_schema(schema_path)
    return validate_payload(payload, schema)


__all__ = ["load_schema", "validate_file", "validate_payload"]
