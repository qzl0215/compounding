from __future__ import annotations

from pathlib import Path
from typing import Any

from .attach import detect_protocol_entries, pattern_exists
from .audit import audit
from .config_resolution import (
    default_brief_payload,
    infer_app_type,
    infer_deploy_target,
    infer_package_manager,
    infer_project_name,
    normalize_brief_payload,
)
from .defaults import BOOTSTRAP_REPORT_PATH, BRIEF_PATH
from .packs import infer_adapter_id, infer_bootstrap_mode, load_kernel_manifest, mode_required_packs, mode_smoke_commands, resolve_supported_mode, selected_pack_paths
from .yaml_io import load_yaml


def has_project_signals(target: Path) -> bool:
    candidates = ("README.md", "package.json", "pyproject.toml", "requirements.txt", "src", "app", "pages", "apps", "services")
    return any((target / path).exists() for path in candidates)


def infer_recommended_entry(target: Path) -> str:
    if (target / BOOTSTRAP_REPORT_PATH).exists():
        return "audit"
    if detect_protocol_entries(target):
        return "audit"
    return "attach" if has_project_signals(target) else "bootstrap"


def load_brief_snapshot(target: Path, config_path: Path | None = None, bootstrap_mode: str | None = None) -> tuple[dict[str, Any], bool]:
    path = config_path if config_path and config_path.exists() else target / BRIEF_PATH
    if path.exists():
        payload = load_yaml(path)
        if not isinstance(payload, dict):
            raise ValueError("Project brief must be an object.")
        normalized, _ = normalize_brief_payload(payload, target, bootstrap_mode=bootstrap_mode)
        return normalized, True
    inferred_mode = "attach" if has_project_signals(target) else "new"
    resolved_bootstrap_mode = bootstrap_mode or infer_bootstrap_mode(target, infer_app_type(target), "")
    payload = default_brief_payload(infer_project_name(target), adoption_mode=inferred_mode, bootstrap_mode=resolved_bootstrap_mode)
    normalized, _ = normalize_brief_payload(payload, target, adoption_mode=inferred_mode, bootstrap_mode=resolved_bootstrap_mode)
    return normalized, False


def evaluate_required_packs(target: Path, manifest: dict[str, Any], pack_ids: list[str]) -> list[dict[str, Any]]:
    copy_paths = selected_pack_paths(manifest, pack_ids, "copy_paths")
    generated_paths = selected_pack_paths(manifest, pack_ids, "generated_paths")
    results: list[dict[str, Any]] = []
    for pack_id in pack_ids:
        pack_copy_paths = [item for item in copy_paths if item in selected_pack_paths(manifest, [pack_id], "copy_paths")]
        pack_generated_paths = [item for item in generated_paths if item in selected_pack_paths(manifest, [pack_id], "generated_paths")]
        missing_copy = [item for item in pack_copy_paths if not pattern_exists(target, item)]
        missing_generated = [item for item in pack_generated_paths if not pattern_exists(target, item)]
        results.append(
            {
                "pack_id": pack_id,
                "ok": len(missing_copy) == 0 and len(missing_generated) == 0,
                "missing_copy_paths": missing_copy,
                "missing_generated_paths": missing_generated,
            }
        )
    return results


def evaluate_capability_groups(target: Path, manifest: dict[str, Any], selected_profile: str) -> list[dict[str, Any]]:
    profiles = manifest.get("profiles") if isinstance(manifest.get("profiles"), list) else []
    selected = next((item for item in profiles if isinstance(item, dict) and item.get("profile_id") == selected_profile), {})
    required_ids = set(selected.get("capability_groups") if isinstance(selected.get("capability_groups"), list) else [])
    groups = manifest.get("capability_groups") if isinstance(manifest.get("capability_groups"), list) else []
    results: list[dict[str, Any]] = []
    for group in groups:
        if not isinstance(group, dict):
            continue
        capability_id = str(group.get("capability_id") or "").strip()
        required_paths = [str(item).strip() for item in group.get("required_paths", []) if str(item).strip()]
        detected = [item for item in required_paths if pattern_exists(target, item)]
        missing = [item for item in required_paths if item not in detected]
        results.append(
            {
                "capability_id": capability_id,
                "label": str(group.get("label") or capability_id),
                "required_for_profile": capability_id in required_ids,
                "ok": len(missing) == 0,
                "detected_paths": detected,
                "missing_paths": missing,
            }
        )
    return results


def doctor(config_path: Path | None, target: Path, bootstrap_mode: str | None = None) -> dict[str, Any]:
    manifest = load_kernel_manifest()
    brief, has_brief = load_brief_snapshot(target, config_path, bootstrap_mode=bootstrap_mode)
    recommended_entry = infer_recommended_entry(target)
    adapter_id = infer_adapter_id(brief["runtime_boundary"]["app_type"])
    inferred_mode = infer_bootstrap_mode(target, brief["runtime_boundary"]["app_type"], brief["kernel"]["profile"])
    requested_mode = bootstrap_mode or str(brief.get("bootstrap_mode") or inferred_mode)
    resolved_mode = resolve_supported_mode(manifest, adapter_id, requested_mode, inferred_mode)
    required_packs = mode_required_packs(manifest, resolved_mode)
    capability_results = evaluate_capability_groups(target, manifest, brief["kernel"]["profile"])
    required_results = [item for item in capability_results if item["required_for_profile"]]
    pack_results = evaluate_required_packs(target, manifest, required_packs)
    audit_result = audit(target / BRIEF_PATH, target) if has_brief and (target / BOOTSTRAP_REPORT_PATH).exists() else None
    blocking_reasons: list[str] = []

    for item in required_results:
        if not item["ok"]:
            blocking_reasons.append(f"capability `{item['capability_id']}` 缺失。")
    for item in pack_results:
        if not item["ok"]:
            blocking_reasons.append(f"pack `{item['pack_id']}` 缺少必需资产。")
    if audit_result and not audit_result.passed:
        blocking_reasons.extend(audit_result.errors)

    next_steps: list[str] = []
    if recommended_entry in {"bootstrap", "attach"}:
        next_steps.append(f"python3 scripts/init_project_compounding.py {recommended_entry} --target . --mode={resolved_mode}")
    elif audit_result and not audit_result.passed:
        next_steps.append("python3 scripts/init_project_compounding.py audit --target .")
    if any(item["capability_id"] == "operator_layer" and not item["ok"] for item in required_results):
        next_steps.append("node --experimental-strip-types scripts/ai/generate-operator-assets.ts")
    if has_brief and audit_result and audit_result.passed and not next_steps:
        next_steps.append("python3 scripts/init_project_compounding.py proposal --target .")
    ready_for_ai_iteration = not blocking_reasons and all(item["ok"] for item in pack_results)

    return {
        "ok": ready_for_ai_iteration,
        "project": {
            "name": brief["project_identity"]["name"],
            "path": str(target.resolve()),
        },
        "kernel": {
            "version": brief["kernel"]["version"],
            "adoption_mode": brief["kernel"]["adoption_mode"],
            "profile": brief["kernel"]["profile"],
            "bootstrap_mode": resolved_mode,
            "brief_present": has_brief,
        },
        "archetype": {
            "adapter_id": adapter_id,
            "app_type": brief["runtime_boundary"]["app_type"] or infer_app_type(target),
            "deploy_target": brief["runtime_boundary"]["deploy_target"] or infer_deploy_target(target),
            "package_manager": infer_package_manager(target),
        },
        "recommended_mode": resolved_mode,
        "requested_mode": requested_mode,
        "recommended_entry": recommended_entry,
        "required_packs": required_packs,
        "pack_status": pack_results,
        "protocol_entries": detect_protocol_entries(target),
        "capabilities": capability_results,
        "audit": {
            "available": audit_result is not None,
            "passed": audit_result.passed if audit_result else None,
            "errors": audit_result.errors if audit_result else [],
            "warnings": audit_result.warnings if audit_result else [],
        },
        "blocking_reasons": blocking_reasons,
        "smoke_commands": mode_smoke_commands(manifest, resolved_mode),
        "ready_for_ai_iteration": ready_for_ai_iteration,
        "next_steps": next_steps,
    }


__all__ = ["doctor", "evaluate_capability_groups", "infer_recommended_entry"]
