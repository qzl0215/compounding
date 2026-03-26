from __future__ import annotations

from pathlib import Path
from typing import Any

from .attach import pattern_exists
from .config_resolution import validate_config_file
from .defaults import (
    BOOTSTRAP_REPORT_PATH,
    BOOTSTRAP_REPORT_SCHEMA_PATH,
    BRIEF_PATH,
    DIFF_CATEGORIES,
    KERNEL_MANIFEST_PATH,
    KERNEL_MANIFEST_SCHEMA_PATH,
    PROJECT_OPERATOR_PATH,
    PROJECT_OPERATOR_SCHEMA_PATH,
    PROJECT_BRIEF_SCHEMA_PATH,
    SOURCE_ROOT,
    AuditResult,
)
from .schema_validation import validate_payload
from .yaml_io import load_yaml


def load_object(path: Path) -> dict[str, Any]:
    payload = load_yaml(path)
    if not isinstance(payload, dict):
        raise ValueError(f"Expected object YAML: {path}")
    return payload


def validate_target_file(path: Path, schema_path: Path, result: AuditResult) -> None:
    if not path.exists():
        result.errors.append(f"Missing required file: {path.as_posix()}")
        return
    payload = load_object(path)
    schema = load_object(schema_path)
    errors = validate_payload(payload, schema)
    result.checked_files.append(path.as_posix())
    result.errors.extend(f"{path.as_posix()}: {error}" for error in errors)


def audit(config_path: Path, target: Path) -> AuditResult:
    result = AuditResult(passed=True)

    validation = validate_config_file(config_path, target)
    if not validation["ok"]:
        result.errors.extend(validation["field_errors"].values())

    validate_target_file(target / BRIEF_PATH, SOURCE_ROOT / PROJECT_BRIEF_SCHEMA_PATH, result)
    validate_target_file(target / PROJECT_OPERATOR_PATH, SOURCE_ROOT / PROJECT_OPERATOR_SCHEMA_PATH, result)
    validate_target_file(SOURCE_ROOT / KERNEL_MANIFEST_PATH, SOURCE_ROOT / KERNEL_MANIFEST_SCHEMA_PATH, result)
    validate_target_file(target / BOOTSTRAP_REPORT_PATH, SOURCE_ROOT / BOOTSTRAP_REPORT_SCHEMA_PATH, result)

    manifest = load_object(SOURCE_ROOT / KERNEL_MANIFEST_PATH)
    brief = load_object(target / BRIEF_PATH) if (target / BRIEF_PATH).exists() else {}
    report = load_object(target / BOOTSTRAP_REPORT_PATH) if (target / BOOTSTRAP_REPORT_PATH).exists() else {}

    for entry in manifest.get("managed_assets", []):
        if not isinstance(entry, dict):
            continue
        relative_path = str(entry.get("path") or "")
        if not relative_path:
            continue
        if not pattern_exists(target, relative_path):
            result.missing_assets.append(relative_path)

    if result.missing_assets:
        result.errors.append(f"Missing kernel-managed assets: {', '.join(result.missing_assets)}")

    protected_paths = [str(item.get("path") or "") for item in manifest.get("protected_assets", []) if isinstance(item, dict)]
    auto_apply_paths = (
        brief.get("upgrade_policy", {}).get("auto_apply_paths")
        if isinstance(brief.get("upgrade_policy"), dict) and isinstance(brief.get("upgrade_policy", {}).get("auto_apply_paths"), list)
        else []
    )
    for protected_path in protected_paths:
        if any(protected_path == path for path in auto_apply_paths):
            result.conflicting_rules.append(f"Protected path in auto_apply_paths: {protected_path}")

    if result.conflicting_rules:
        result.errors.extend(result.conflicting_rules)

    if isinstance(report.get("actions"), dict):
        for field in DIFF_CATEGORIES:
            pass
        needs_proposal = report["actions"].get("needs_proposal")
        if needs_proposal is not None and not isinstance(needs_proposal, list):
            result.errors.append("output/bootstrap/bootstrap_report.yaml: actions.needs_proposal must be an array")

    required_protocol = [
        "memory/project/roadmap.md",
        "memory/project/current-state.md",
        "memory/project/operating-blueprint.md",
    ]
    for path in required_protocol:
        if not (target / path).exists():
            result.errors.append(f"Missing project protocol entry: {path}")

    result.passed = not result.errors
    return result


__all__ = ["audit"]
