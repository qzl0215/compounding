from __future__ import annotations

from fnmatch import fnmatchcase
from pathlib import Path
from typing import Any

from .config_resolution import ensure_brief, infer_app_type, infer_kernel_profile
from .defaults import (
    AGENTS_PATH,
    BOOTSTRAP_REPORT_PATH,
    BOOTSTRAP_REPORT_SCHEMA_PATH,
    KERNEL_MANIFEST_PATH,
    MINIMAL_PROTOCOL_DOCS,
    SOURCE_ROOT,
)
from .operator_contract import ensure_operator_contract, sync_operator_assets
from .packs import infer_adapter_id, infer_bootstrap_mode, mode_required_packs, resolve_supported_mode
from .schema_validation import validate_payload
from .yaml_io import load_yaml, save_yaml


def path_matches(path: str, pattern: str) -> bool:
    if "*" in pattern:
        return fnmatchcase(path, pattern)
    return path == pattern


def pattern_exists(target: Path, pattern: str) -> bool:
    if "*" in pattern:
        return any(True for _ in target.glob(pattern))
    return (target / pattern).exists()


def detect_section(target: Path, section: list[dict[str, Any]]) -> list[str]:
    detected: list[str] = []
    for item in section:
        path = str(item.get("path") or "").strip()
        if path and pattern_exists(target, path):
            detected.append(path)
    return detected


def load_kernel_manifest() -> dict[str, Any]:
    payload = load_yaml(SOURCE_ROOT / KERNEL_MANIFEST_PATH)
    if not isinstance(payload, dict):
        raise ValueError("Kernel manifest must be an object.")
    return payload


def detect_protocol_entries(target: Path) -> list[str]:
    entries = [AGENTS_PATH, *MINIMAL_PROTOCOL_DOCS, "memory/project/operating-blueprint.md"]
    return [path for path in entries if (target / path).exists()]


def detect_local_overrides(target: Path, payload: dict[str, Any]) -> list[str]:
    overrides = payload.get("local_overrides") if isinstance(payload.get("local_overrides"), dict) else {}
    owned_paths = overrides.get("owned_paths") if isinstance(overrides.get("owned_paths"), list) else []
    return [pattern for pattern in owned_paths if isinstance(pattern, str) and pattern_exists(target, pattern)]


def attach_score(brief_valid: bool, kernel_version_present: bool, protocol_detected: bool, overrides_detected: bool, proposal_ready: bool) -> int:
    checks = [brief_valid, kernel_version_present, protocol_detected, overrides_detected, proposal_ready]
    return sum(20 for item in checks if item)


def create_report(target: Path, brief: dict[str, Any], manifest: dict[str, Any], created_actions: list[str], skipped_actions: list[str]) -> dict[str, Any]:
    managed_assets = manifest.get("managed_assets") if isinstance(manifest.get("managed_assets"), list) else []
    shell_assets = manifest.get("shell_assets") if isinstance(manifest.get("shell_assets"), list) else []
    protected_assets = manifest.get("protected_assets") if isinstance(manifest.get("protected_assets"), list) else []
    bootstrap_mode = str(brief.get("bootstrap_mode") or infer_bootstrap_mode(target, brief["runtime_boundary"]["app_type"], brief["kernel"]["profile"]))
    adapter_id = infer_adapter_id(brief["runtime_boundary"]["app_type"])
    required_packs = mode_required_packs(manifest, bootstrap_mode)
    has_ai_exec_pack = "ai_exec_pack" in required_packs
    selected_copy_paths = set()
    for pack_id in required_packs:
        pack = next(
            (item for item in manifest.get("packs", []) if isinstance(item, dict) and str(item.get("pack_id") or "").strip() == pack_id),
            {},
        )
        for item in pack.get("copy_paths", []) if isinstance(pack.get("copy_paths"), list) else []:
            value = str(item).strip()
            if value:
                selected_copy_paths.add(value)

    protocol_entries = detect_protocol_entries(target)
    detected_overrides = detect_local_overrides(target, brief)
    proposal_ready = bool(manifest.get("version")) and bool(managed_assets)

    needs_proposal = [
        item["path"]
        for item in managed_assets
        if isinstance(item, dict)
        and str(item.get("path") or "") in selected_copy_paths
        and not pattern_exists(target, str(item.get("path") or ""))
    ]
    warnings = []
    if AGENTS_PATH not in protocol_entries:
        warnings.append("AGENTS.md is missing; attach completed but protocol entry is incomplete.")
    if "memory/project/operating-blueprint.md" not in protocol_entries:
        warnings.append("memory/project/operating-blueprint.md is missing; planning entry is incomplete.")

    report = {
        "project": {
            "name": brief["project_identity"]["name"],
            "path": str(target.resolve()),
        },
        "kernel": {
            "version": brief["kernel"]["version"],
            "adoption_mode": brief["kernel"]["adoption_mode"],
            "profile": brief["kernel"]["profile"],
            "bootstrap_mode": bootstrap_mode,
            "adapter_id": adapter_id,
            "required_packs": required_packs,
        },
        "runtime": {
            "app_type": brief["runtime_boundary"]["app_type"],
            "deploy_target": brief["runtime_boundary"]["deploy_target"],
            "critical_paths": brief["runtime_boundary"]["critical_paths"],
        },
        "status": {
            "attached": True,
            "attach_score": attach_score(
                brief_valid=True,
                kernel_version_present=bool(brief["kernel"]["version"]),
                protocol_detected=bool(protocol_entries),
                overrides_detected=bool(detected_overrides),
                proposal_ready=proposal_ready,
            ),
            "summary": "Legacy attach completed with kernel/shell boundaries recorded and proposal inputs prepared.",
            "ready_for_ai_iteration": has_ai_exec_pack and pattern_exists(target, "scripts/coord/preflight.ts") and pattern_exists(target, "docs/OPERATOR_RUNBOOK.md"),
        },
        "detected": {
            "managed_assets": detect_section(target, managed_assets),
            "shell_assets": detect_section(target, shell_assets),
            "protected_assets": detect_section(target, protected_assets),
            "local_overrides": detected_overrides,
        },
        "actions": {
            "created": created_actions,
            "skipped": skipped_actions,
            "needs_proposal": needs_proposal,
            "warnings": warnings,
        },
    }
    return report


def attach(config_path: Path | None, target: Path, adoption_mode: str = "attach", bootstrap_mode: str | None = None) -> dict[str, Any]:
    manifest = load_kernel_manifest()
    inferred_app_type = infer_app_type(target)
    inferred_profile = infer_kernel_profile(target, inferred_app_type)
    resolved_mode = resolve_supported_mode(
        manifest,
        infer_adapter_id(inferred_app_type),
        bootstrap_mode or infer_bootstrap_mode(target, inferred_app_type, inferred_profile),
        infer_bootstrap_mode(target, inferred_app_type, inferred_profile),
    )
    brief_path, brief_payload, brief_changed = ensure_brief(config_path, target, adoption_mode=adoption_mode, bootstrap_mode=resolved_mode)
    operator_path, _, operator_changed = ensure_operator_contract(target)
    created_actions: list[str] = []
    skipped_actions: list[str] = []
    if brief_changed:
        created_actions.append(f"{brief_path.relative_to(target).as_posix()} (created or migrated)")
    else:
        skipped_actions.append(f"{brief_path.relative_to(target).as_posix()} (already normalized)")
    if operator_changed:
        created_actions.append(f"{operator_path.relative_to(target).as_posix()} (created or normalized)")
    else:
        skipped_actions.append(f"{operator_path.relative_to(target).as_posix()} (already normalized)")
    if "tooling_pack" in mode_required_packs(manifest, str(brief_payload.get("bootstrap_mode") or infer_bootstrap_mode(target, infer_app_type(target), brief_payload["kernel"]["profile"]))):
        if sync_operator_assets(target):
            created_actions.append("docs/OPERATOR_RUNBOOK.md / CLAUDE.md / OPENCODE.md / .cursor/rules/00-project-entry.mdc (generated)")

    report_path = target / BOOTSTRAP_REPORT_PATH
    report = create_report(target, brief_payload, manifest, created_actions, skipped_actions)
    schema = load_yaml(SOURCE_ROOT / BOOTSTRAP_REPORT_SCHEMA_PATH)
    errors = validate_payload(report, schema)
    if errors:
        raise ValueError("; ".join(errors))
    save_yaml(report_path, report)
    if not report_path.relative_to(target).as_posix() in report["actions"]["created"]:
        report["actions"]["created"].append(report_path.relative_to(target).as_posix())
        save_yaml(report_path, report)
    return report


__all__ = ["attach", "path_matches", "pattern_exists"]
