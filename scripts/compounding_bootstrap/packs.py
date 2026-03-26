from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .defaults import KERNEL_MANIFEST_PATH, SOURCE_ROOT
from .yaml_io import load_yaml, save_yaml

PACK_EXPORTS_PATH = Path("output/bootstrap/pack-exports.yaml")

MODE_IDS = {"cold_start", "normalize", "ai_upgrade"}
ADAPTER_IDS = {"generic_repo", "node_service", "web_app", "python_service"}


def load_kernel_manifest() -> dict[str, Any]:
    payload = load_yaml(SOURCE_ROOT / KERNEL_MANIFEST_PATH)
    if not isinstance(payload, dict):
        raise ValueError("Kernel manifest must be an object.")
    return payload


def has_project_signals(target: Path) -> bool:
    candidates = ("README.md", "package.json", "pyproject.toml", "requirements.txt", "src", "app", "pages", "apps", "services")
    return any((target / item).exists() for item in candidates)


def infer_adapter_id(app_type: str) -> str:
    normalized = str(app_type or "").strip()
    if normalized in {"nextjs-app", "nextjs-static-site", "web-app"}:
        return "web_app"
    if normalized in {"node-service", "javascript-package", "ai-native-repo", "application"}:
        return "node_service"
    if normalized in {"python-service", "python-package"}:
        return "python_service"
    return "generic_repo"


def infer_bootstrap_mode(target: Path, app_type: str, profile: str) -> str:
    if not has_project_signals(target):
        return "cold_start"
    adapter_id = infer_adapter_id(app_type)
    if str(profile or "").strip() == "full_ai_dev" and adapter_supports_mode(load_kernel_manifest(), adapter_id, "ai_upgrade"):
        return "ai_upgrade"
    return "normalize"


def list_packs(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    packs = manifest.get("packs")
    return packs if isinstance(packs, list) else []


def list_mode_packs(manifest: dict[str, Any]) -> list[dict[str, Any]]:
    mode_packs = manifest.get("mode_packs")
    return mode_packs if isinstance(mode_packs, list) else []


def get_pack(manifest: dict[str, Any], pack_id: str) -> dict[str, Any]:
    return next(
        (item for item in list_packs(manifest) if isinstance(item, dict) and str(item.get("pack_id") or "").strip() == pack_id),
        {},
    )


def get_mode_pack(manifest: dict[str, Any], mode_id: str) -> dict[str, Any]:
    return next(
        (item for item in list_mode_packs(manifest) if isinstance(item, dict) and str(item.get("mode_id") or "").strip() == mode_id),
        {},
    )


def mode_default_profile(manifest: dict[str, Any], mode_id: str) -> str:
    return str(get_mode_pack(manifest, mode_id).get("default_profile") or "governance").strip()


def mode_required_packs(manifest: dict[str, Any], mode_id: str) -> list[str]:
    values = get_mode_pack(manifest, mode_id).get("required_packs")
    return [str(item).strip() for item in values if str(item).strip()] if isinstance(values, list) else []


def mode_smoke_commands(manifest: dict[str, Any], mode_id: str) -> list[str]:
    values = get_mode_pack(manifest, mode_id).get("smoke_commands")
    return [str(item).strip() for item in values if str(item).strip()] if isinstance(values, list) else []


def mode_compatible_adapters(manifest: dict[str, Any], mode_id: str) -> list[str]:
    values = get_mode_pack(manifest, mode_id).get("compatible_adapters")
    return [str(item).strip() for item in values if str(item).strip()] if isinstance(values, list) else []


def adapter_supports_mode(manifest: dict[str, Any], adapter_id: str, mode_id: str) -> bool:
    compatible = mode_compatible_adapters(manifest, mode_id)
    return not compatible or adapter_id in compatible


def resolve_supported_mode(manifest: dict[str, Any], adapter_id: str, requested_mode: str, inferred_mode: str | None = None) -> str:
    requested = str(requested_mode or "").strip() or "normalize"
    inferred = str(inferred_mode or "").strip()
    candidates = [requested]
    if inferred and inferred not in candidates:
        candidates.append(inferred)
    for fallback in ("normalize", "cold_start"):
        if fallback not in candidates:
            candidates.append(fallback)
    for candidate in candidates:
        if candidate in MODE_IDS and adapter_supports_mode(manifest, adapter_id, candidate):
            return candidate
    return requested if requested in MODE_IDS else "normalize"


def selected_pack_paths(manifest: dict[str, Any], pack_ids: list[str], field: str) -> list[str]:
    items: list[str] = []
    for pack_id in pack_ids:
        pack = get_pack(manifest, pack_id)
        values = pack.get(field)
        if not isinstance(values, list):
            continue
        for item in values:
            value = str(item).strip()
            if value and value not in items:
                items.append(value)
    return items


def expand_patterns(root: Path, patterns: list[str]) -> list[Path]:
    resolved: list[Path] = []
    for pattern in patterns:
        if "*" in pattern:
            resolved.extend(path for path in sorted(root.glob(pattern)) if path.is_file())
            continue
        candidate = root / pattern
        if candidate.is_file():
            resolved.append(candidate)
    return resolved


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def export_packs(output_path: Path | None = None) -> Path:
    manifest = load_kernel_manifest()
    target_path = output_path or (SOURCE_ROOT / PACK_EXPORTS_PATH)
    target_path.parent.mkdir(parents=True, exist_ok=True)
    exported = {
        "version": str(manifest.get("version") or ""),
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "packs": [],
        "mode_packs": [],
    }
    for pack in list_packs(manifest):
        if not isinstance(pack, dict):
            continue
        pack_id = str(pack.get("pack_id") or "").strip()
        if not pack_id:
            continue
        copy_paths = [str(item).strip() for item in pack.get("copy_paths", []) if str(item).strip()]
        files = [
            {
                "path": str(path.relative_to(SOURCE_ROOT)).replace("\\", "/"),
                "sha256": sha256_file(path),
            }
            for path in expand_patterns(SOURCE_ROOT, copy_paths)
        ]
        exported["packs"].append(
            {
                "pack_id": pack_id,
                "copy_paths": copy_paths,
                "generated_paths": [str(item).strip() for item in pack.get("generated_paths", []) if str(item).strip()],
                "file_count": len(files),
                "files": files,
            }
        )
    for mode_pack in list_mode_packs(manifest):
        if not isinstance(mode_pack, dict):
            continue
        mode_id = str(mode_pack.get("mode_id") or "").strip()
        if not mode_id:
            continue
        exported["mode_packs"].append(
            {
                "mode_id": mode_id,
                "default_profile": str(mode_pack.get("default_profile") or "").strip(),
                "required_packs": [str(item).strip() for item in mode_pack.get("required_packs", []) if str(item).strip()],
                "compatible_adapters": [
                    str(item).strip() for item in mode_pack.get("compatible_adapters", []) if str(item).strip()
                ],
                "smoke_commands": [str(item).strip() for item in mode_pack.get("smoke_commands", []) if str(item).strip()],
            }
        )
    save_yaml(target_path, exported)
    return target_path


__all__ = [
    "ADAPTER_IDS",
    "MODE_IDS",
    "PACK_EXPORTS_PATH",
    "adapter_supports_mode",
    "expand_patterns",
    "export_packs",
    "get_mode_pack",
    "get_pack",
    "has_project_signals",
    "infer_adapter_id",
    "infer_bootstrap_mode",
    "list_mode_packs",
    "list_packs",
    "load_kernel_manifest",
    "mode_compatible_adapters",
    "mode_default_profile",
    "mode_required_packs",
    "mode_smoke_commands",
    "resolve_supported_mode",
    "selected_pack_paths",
]
