from __future__ import annotations

import shutil
from datetime import datetime, timezone
from fnmatch import fnmatchcase
from pathlib import Path
from typing import Any

from .attach import attach, pattern_exists
from .bootstrap import write_shell_asset
from .config_resolution import ensure_brief
from .defaults import (
    BOOTSTRAP_REPORT_PATH,
    BRIEF_PATH,
    DIFF_CATEGORIES,
    KERNEL_MANIFEST_PATH,
    MINIMAL_MEMORY_DOCS,
    OUTPUT_PROPOSALS_DIR,
    PROPOSAL_SCHEMA_PATH,
    SOURCE_ROOT,
)
from .proposal_support import git, git_has_staged_changes, git_head, git_is_dirty
from .schema_validation import validate_payload
from .yaml_io import load_yaml, save_yaml


def path_matches(path: str, patterns: list[str]) -> bool:
    return any(fnmatchcase(path, pattern) if "*" in pattern else path == pattern for pattern in patterns)


def local_override_paths(brief: dict[str, Any]) -> list[str]:
    overrides = brief.get("local_overrides") if isinstance(brief.get("local_overrides"), dict) else {}
    owned_paths = overrides.get("owned_paths") if isinstance(overrides.get("owned_paths"), list) else []
    return [str(item).strip() for item in owned_paths if isinstance(item, str) and str(item).strip()]


def load_report(target: Path) -> dict[str, Any]:
    report_path = target / BOOTSTRAP_REPORT_PATH
    if not report_path.exists():
        return attach(target / "bootstrap/project_brief.yaml", target)
    payload = load_yaml(report_path)
    if not isinstance(payload, dict):
        raise ValueError("Bootstrap report must be an object.")
    return payload


def load_brief(target: Path) -> dict[str, Any]:
    payload = load_yaml(target / "bootstrap/project_brief.yaml")
    if not isinstance(payload, dict):
        raise ValueError("Project brief must be an object.")
    return payload


def load_manifest() -> dict[str, Any]:
    payload = load_yaml(SOURCE_ROOT / KERNEL_MANIFEST_PATH)
    if not isinstance(payload, dict):
        raise ValueError("Kernel manifest must be an object.")
    return payload


def canonical_file_differs(target: Path, relative_path: str) -> bool:
    if "*" in relative_path:
        return False
    source = SOURCE_ROOT / relative_path
    destination = target / relative_path
    if not source.exists() or not destination.exists():
        return False
    return source.read_text(encoding="utf8") != destination.read_text(encoding="utf8")


def classify_managed_asset(target: Path, entry: dict[str, Any], brief: dict[str, Any]) -> tuple[str | None, str | None]:
    relative_path = str(entry.get("path") or "")
    sync_mode = str(entry.get("sync_mode") or "proposal")
    upgrade_policy = brief.get("upgrade_policy") if isinstance(brief.get("upgrade_policy"), dict) else {}
    override_paths = local_override_paths(brief)
    auto_apply_paths = upgrade_policy.get("auto_apply_paths") if isinstance(upgrade_policy.get("auto_apply_paths"), list) else []
    proposal_required_paths = (
        upgrade_policy.get("proposal_required_paths") if isinstance(upgrade_policy.get("proposal_required_paths"), list) else []
    )
    blocked_paths = upgrade_policy.get("blocked_paths") if isinstance(upgrade_policy.get("blocked_paths"), list) else []

    if path_matches(relative_path, blocked_paths):
        return "blocked", "blocked by upgrade policy"
    if path_matches(relative_path, override_paths):
        if pattern_exists(target, relative_path):
            return "suggest_only", "project-owned local override"
        return None, None
    exists = pattern_exists(target, relative_path)
    if not exists:
        if path_matches(relative_path, auto_apply_paths) or sync_mode == "auto":
            return "auto_apply", None
        return "proposal_required", None
    if canonical_file_differs(target, relative_path):
        return "proposal_required", "managed path diverges from kernel"
    if path_matches(relative_path, auto_apply_paths):
        return None, None
    if path_matches(relative_path, proposal_required_paths):
        return None, None
    return None, None


def missing_shell_protocol_assets(target: Path) -> list[str]:
    return [path for path in MINIMAL_MEMORY_DOCS if not pattern_exists(target, path)]


def build_conflicts(manifest: dict[str, Any], brief: dict[str, Any], target: Path) -> list[dict[str, str]]:
    conflicts: list[dict[str, str]] = []
    upgrade_policy = brief.get("upgrade_policy") if isinstance(brief.get("upgrade_policy"), dict) else {}
    override_paths = local_override_paths(brief)
    auto_apply_paths = upgrade_policy.get("auto_apply_paths") if isinstance(upgrade_policy.get("auto_apply_paths"), list) else []
    proposal_required_paths = (
        upgrade_policy.get("proposal_required_paths") if isinstance(upgrade_policy.get("proposal_required_paths"), list) else []
    )
    blocked_paths = upgrade_policy.get("blocked_paths") if isinstance(upgrade_policy.get("blocked_paths"), list) else []
    shell_paths = [str(item.get("path") or "") for item in manifest.get("shell_assets", []) if isinstance(item, dict)]
    protected_paths = [str(item.get("path") or "") for item in manifest.get("protected_assets", []) if isinstance(item, dict)]

    for entry in manifest.get("managed_assets", []):
        if not isinstance(entry, dict):
            continue
        relative_path = str(entry.get("path") or "")
        if path_matches(relative_path, override_paths):
            continue
        if canonical_file_differs(target, relative_path):
            conflicts.append(
                {
                    "path": relative_path,
                    "reason": "kernel-managed path has local divergence",
                    "recommendation": "Review the local diff before syncing this managed asset.",
                }
            )
        if path_matches(relative_path, blocked_paths):
            conflicts.append(
                {
                    "path": relative_path,
                    "reason": "managed asset is blocked by project upgrade policy",
                    "recommendation": "Move this path out of blocked_paths or keep it project-owned.",
                }
            )

    for relative_path in [*shell_paths, *protected_paths]:
        if path_matches(relative_path, auto_apply_paths) or path_matches(relative_path, proposal_required_paths):
            conflicts.append(
                {
                    "path": relative_path,
                    "reason": "shell/protected asset was included in kernel upgrade policy",
                    "recommendation": "Remove this path from auto_apply/proposal_required and keep it local.",
                }
            )
    unique: dict[tuple[str, str], dict[str, str]] = {}
    for item in conflicts:
        unique[(item["path"], item["reason"])] = item
    return list(unique.values())


def create_proposal(target: Path, config_path: Path | None = None) -> str:
    report = load_report(target)
    brief = load_brief(target)
    manifest = load_manifest()

    changes = {category: [] for category in DIFF_CATEGORIES}
    for entry in manifest.get("managed_assets", []):
        if not isinstance(entry, dict):
            continue
        category, _ = classify_managed_asset(target, entry, brief)
        if category:
            changes[category].append(str(entry.get("path") or ""))

    for entry in manifest.get("shell_assets", []):
        if not isinstance(entry, dict):
            continue
        path = str(entry.get("path") or "")
        if pattern_exists(target, path):
            changes["suggest_only"].append(path)

    for entry in manifest.get("protected_assets", []):
        if not isinstance(entry, dict):
            continue
        path = str(entry.get("path") or "")
        if pattern_exists(target, path):
            changes["blocked"].append(path)

    for path in missing_shell_protocol_assets(target):
        changes["auto_apply"].append(path)

    conflicts = build_conflicts(manifest, brief, target)
    must_confirm = sorted(set(changes["proposal_required"] + [item["path"] for item in conflicts]))
    optional_followups = sorted(set(changes["suggest_only"] + changes["blocked"]))

    kernel_version_from = "untracked" if any(
        item.startswith("bootstrap/project_brief.yaml") for item in report.get("actions", {}).get("created", [])
    ) else str(brief.get("kernel", {}).get("version") or "untracked")
    proposal_id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    proposal = {
        "proposal_id": proposal_id,
        "project": {
            "name": report["project"]["name"],
            "path": report["project"]["path"],
        },
        "kernel_version_from": kernel_version_from,
        "kernel_version_to": str(manifest.get("version") or ""),
        "changes": changes,
        "conflicts": conflicts,
        "operator_actions": {
            "must_confirm": must_confirm,
            "optional_followups": optional_followups,
        },
    }

    schema = load_yaml(SOURCE_ROOT / PROPOSAL_SCHEMA_PATH)
    errors = validate_payload(proposal, schema)
    if errors:
        raise ValueError("; ".join(errors))

    proposal_root = target / OUTPUT_PROPOSALS_DIR / proposal_id
    proposal_root.mkdir(parents=True, exist_ok=True)
    save_yaml(proposal_root / "proposal.yaml", proposal)
    metadata = {
        "id": proposal_id,
        "status": "pending",
        "action_type": "kernel_sync",
        "base_revision": git_head(target),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "apply_commit_message": f"chore: apply kernel proposal {proposal_id}",
        "auto_apply_paths": proposal["changes"]["auto_apply"],
        "proposal_required_paths": proposal["changes"]["proposal_required"],
        "blocked_paths": proposal["changes"]["blocked"],
    }
    save_yaml(proposal_root / "metadata.yaml", metadata)
    return proposal_id


def proposal_root(target: Path, proposal_id: str) -> Path:
    return target / OUTPUT_PROPOSALS_DIR / proposal_id


def load_proposal_files(target: Path, proposal_id: str) -> tuple[dict[str, Any], dict[str, Any], Path]:
    root = proposal_root(target, proposal_id)
    proposal_path = root / "proposal.yaml"
    metadata_path = root / "metadata.yaml"
    if not proposal_path.exists():
        raise ValueError(f"Unknown kernel proposal: {proposal_id}")
    proposal = load_yaml(proposal_path)
    if not isinstance(proposal, dict):
        raise ValueError("Kernel proposal must be an object.")
    metadata = load_yaml(metadata_path) if metadata_path.exists() else {}
    if metadata and not isinstance(metadata, dict):
        raise ValueError("Kernel proposal metadata must be an object.")
    return proposal, metadata if isinstance(metadata, dict) else {}, root


def expand_source_paths(pattern: str) -> list[Path]:
    if "*" in pattern:
        return sorted(path for path in SOURCE_ROOT.glob(pattern) if path.is_file())
    source = SOURCE_ROOT / pattern
    return [source] if source.is_file() else []


def copy_source_asset(target: Path, relative_path: str) -> list[str]:
    copied: list[str] = []
    if relative_path == BRIEF_PATH:
        ensure_brief(target / BRIEF_PATH, target)
        return [BRIEF_PATH]
    if relative_path in MINIMAL_MEMORY_DOCS and write_shell_asset(target, relative_path, target.resolve().name):
        return [relative_path]
    for source_path in expand_source_paths(relative_path):
        destination = target / source_path.relative_to(SOURCE_ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source_path, destination)
        copied.append(destination.relative_to(target).as_posix())
    if not copied:
        raise ValueError(f"Cannot auto-apply missing source asset: {relative_path}")
    return copied


def apply_proposal(target: Path, proposal_id: str) -> dict[str, Any]:
    proposal, metadata, root = load_proposal_files(target, proposal_id)
    if metadata.get("status") == "applied":
        raise ValueError("Kernel proposal is already applied.")

    head = git_head(target)
    if not head:
        raise ValueError("Baseline commit required before applying proposals.")
    if git_has_staged_changes(target):
        raise ValueError("Cannot apply proposal while staged changes exist.")
    if git_is_dirty(target):
        raise ValueError("Cannot apply proposal because worktree is dirty.")
    if metadata.get("base_revision") and metadata["base_revision"] != head:
        raise ValueError("Proposal base revision no longer matches current HEAD.")

    auto_apply_paths = proposal.get("changes", {}).get("auto_apply") if isinstance(proposal.get("changes"), dict) else []
    if not isinstance(auto_apply_paths, list) or not auto_apply_paths:
        raise ValueError("Kernel proposal has no auto_apply changes.")

    applied_paths: list[str] = []
    for relative_path in auto_apply_paths:
        if not isinstance(relative_path, str):
            continue
        applied_paths.extend(copy_source_asset(target, relative_path))

    brief_payload = load_yaml(target / BRIEF_PATH)
    adoption_mode = "attach"
    if isinstance(brief_payload, dict):
        kernel = brief_payload.get("kernel")
        if isinstance(kernel, dict) and isinstance(kernel.get("adoption_mode"), str):
            adoption_mode = kernel["adoption_mode"]
    attach(target / BRIEF_PATH, target, adoption_mode=adoption_mode)

    metadata["status"] = "applied"
    metadata["applied_at"] = datetime.now(timezone.utc).isoformat()
    metadata["applied_paths"] = sorted(set(applied_paths))
    save_yaml(root / "metadata.yaml", metadata)

    git(["add", "."], target)
    git(["commit", "-m", str(metadata.get("apply_commit_message") or f"chore: apply kernel proposal {proposal_id}")], target)
    return metadata


__all__ = ["apply_proposal", "create_proposal"]
