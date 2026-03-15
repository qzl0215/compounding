from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .defaults import BRIEF_PATH, LEGACY_CONFIG_PATH
from .repo_scan import scan_repo, slugify
from .yaml_io import load_yaml, save_yaml


def validate_brief_payload(payload: dict[str, Any]) -> dict[str, Any]:
    required = [
        "project_name",
        "project_one_liner",
        "success_definition",
        "current_priority",
        "must_protect",
        "runtime_boundary",
    ]
    field_errors: dict[str, str] = {}
    for key in required:
        value = payload.get(key)
        if value in (None, "", []):
            field_errors[key] = "This field is required."
    if "runtime_boundary" in payload and payload.get("runtime_boundary") not in {"server-only", "local-only", "hybrid"}:
        field_errors["runtime_boundary"] = "Runtime boundary must be one of server-only, local-only, or hybrid."
    if "must_protect" in payload and not isinstance(payload.get("must_protect"), list):
        field_errors["must_protect"] = "Must protect must be a list."
    return {
        "ok": not field_errors,
        "message": "Config valid." if not field_errors else "Config validation failed.",
        "field_errors": field_errors,
    }


def validate_config_file(config_path: Path, target: Path) -> dict[str, Any]:
    path = config_path if config_path.exists() else target / BRIEF_PATH
    if not path.exists():
        migrated = migrate_legacy_config(target)
        path = migrated
    payload = load_yaml(path)
    return validate_brief_payload(payload)


def migrate_legacy_config(target: Path) -> Path:
    brief_path = target / BRIEF_PATH
    if brief_path.exists():
        return brief_path
    legacy_path = target / LEGACY_CONFIG_PATH
    if not legacy_path.exists():
        raise FileNotFoundError(f"Neither {brief_path} nor {legacy_path} exists.")
    legacy = load_yaml(legacy_path)
    goals = legacy.get("short_term_priorities") or legacy.get("primary_goals") or ["完成 AI-Native Repo 第一轮结构收敛。"]
    frozen = legacy.get("frozen_items") or [
        "AGENTS.md 是唯一主源",
        "不引入平行规则体系",
    ]
    brief_payload = {
        "project_name": legacy.get("project_name", "Untitled AI-Native Repo"),
        "project_one_liner": legacy.get("project_one_liner", "让 AI 能高效理解、协作、删减和持续重构的仓库。"),
        "success_definition": legacy.get(
            "north_star_metric",
            "任何新线程先读 AGENTS.md 即可进入统一执行协议，并在最小上下文内完成可信改动。",
        ),
        "current_priority": goals[0] if isinstance(goals, list) and goals else "完成 AI-Native Repo 第一轮结构收敛。",
        "must_protect": frozen if isinstance(frozen, list) else [str(frozen)],
        "runtime_boundary": legacy.get("runtime_boundary", "server-only"),
    }
    save_yaml(brief_path, brief_payload)
    return brief_path


def resolve_project_config(brief_path: Path, target: Path) -> dict[str, Any]:
    brief = load_yaml(brief_path)
    scan = scan_repo(target)
    return {
        "project_name": brief["project_name"],
        "project_slug": slugify(brief["project_name"]),
        "project_one_liner": brief["project_one_liner"],
        "success_definition": brief["success_definition"],
        "current_priority": brief["current_priority"],
        "must_protect": brief["must_protect"],
        "runtime_boundary": brief["runtime_boundary"],
        "repo_scan": scan,
        "allowed_scopes": [
            "apps/studio/**",
            "scripts/**",
            "docs/**",
            "memory/**",
            "code_index/**",
            "tasks/**",
        ],
    }
