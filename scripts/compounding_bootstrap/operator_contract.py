from __future__ import annotations

import json
import subprocess
from copy import deepcopy
from pathlib import Path
from typing import Any

from .config_resolution import infer_project_name
from .defaults import PROJECT_OPERATOR_PATH, PROJECT_OPERATOR_SCHEMA_PATH, PROJECT_OPERATOR_TEMPLATE_PATH, SOURCE_ROOT
from .schema_validation import validate_payload
from .yaml_io import load_yaml, save_yaml


def load_package_json(target: Path) -> dict[str, Any]:
    path = target / "package.json"
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf8"))
    except json.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}


def has_script(package_json: dict[str, Any], script_name: str) -> bool:
    scripts = package_json.get("scripts")
    return isinstance(scripts, dict) and isinstance(scripts.get(script_name), str) and bool(str(scripts.get(script_name)).strip())


def git_output(target: Path, args: list[str]) -> str:
    try:
        completed = subprocess.run(
            ["git", *args],
            cwd=target,
            capture_output=True,
            check=True,
            text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return ""
    return completed.stdout.strip()


def parse_github_remote(value: str) -> tuple[str, str] | None:
    remote = str(value or "").strip()
    if not remote:
        return None
    normalized = remote
    if normalized.startswith("git@github.com:"):
        normalized = normalized.split(":", 1)[1]
    elif "github.com/" in normalized:
        normalized = normalized.split("github.com/", 1)[1]
    else:
        return None
    normalized = normalized.removesuffix(".git").strip("/")
    parts = normalized.split("/")
    if len(parts) < 2 or not parts[0] or not parts[1]:
        return None
    return parts[0], parts[1]


def default_server_surfaces(target: Path) -> list[dict[str, Any]]:
    package_json = load_package_json(target)
    preview_enabled = all(has_script(package_json, name) for name in ("preview:start", "preview:stop", "preview:status", "preview:check"))
    prod_enabled = all(has_script(package_json, name) for name in ("prod:start", "prod:stop", "prod:status", "prod:check"))
    return [
        {
            "surface_id": "local-preview",
            "purpose": "preview",
            "enabled": preview_enabled,
            "transport": "local_process",
            "host": "127.0.0.1",
            "port": 3011,
            "base_url": "http://127.0.0.1:3011",
            "access_via": "pnpm preview:start",
            "auth": {"mode": "none", "secret_refs": []},
            "commands": {
                "start": "pnpm preview:start",
                "stop": "pnpm preview:stop",
                "status": "pnpm preview:status",
                "check": "pnpm preview:check",
            },
            "notes": ["本地 preview channel；当前仓库通过 scripts/local-runtime/* 管理。"],
        },
        {
            "surface_id": "local-production",
            "purpose": "production",
            "enabled": prod_enabled,
            "transport": "local_process",
            "host": "127.0.0.1",
            "port": 3010,
            "base_url": "http://127.0.0.1:3010",
            "access_via": "pnpm prod:start",
            "auth": {"mode": "none", "secret_refs": []},
            "commands": {
                "start": "pnpm prod:start",
                "stop": "pnpm prod:stop",
                "status": "pnpm prod:status",
                "check": "pnpm prod:check",
            },
            "notes": ["本地 production runtime；是否真正在线以 prod 状态和 prod 检查命令为准。"],
        },
    ]


def default_github_surface(target: Path) -> dict[str, Any]:
    remote = git_output(target, ["remote", "get-url", "origin"])
    parsed = parse_github_remote(remote)
    enabled = parsed is not None
    owner, repo = parsed if parsed else ("", "")
    notes = (
        ["默认优先使用 gh auth / gh cli，而不是把 token 写进仓库。"]
        if enabled
        else [
            "当前仓库未检测到 remote origin；接入 GitHub 后再补 owner、repo 和 required_checks。",
            "默认优先使用 gh auth / gh cli，而不是把 token 写进仓库。",
        ]
    )
    return {
        "enabled": enabled,
        "provider": "github",
        "owner": owner,
        "repo": repo,
        "remote_name": "origin",
        "default_branch": "main",
        "auth": {"mode": "gh_cli", "secret_refs": []},
        "commands": {
            "status": "gh repo view",
            "sync": "git fetch --all --prune",
            "open_pr": "gh pr create --fill",
            "checks": "gh pr checks",
        },
        "required_checks": [],
        "notes": notes,
    }


def default_standard_flows() -> dict[str, Any]:
    return {
        "preflight": {
            "basic": "pnpm preflight",
            "task": "pnpm preflight -- --taskId=t-xxx",
        },
        "preview_release": {
            "prepare": "node --experimental-strip-types scripts/release/prepare-release.ts --ref HEAD --channel dev --primary-task <taskId>",
            "accept": "node --experimental-strip-types scripts/release/accept-dev-release.ts --release <releaseId>",
            "reject": "node --experimental-strip-types scripts/release/reject-dev-release.ts --release <releaseId>",
        },
        "production_release": {
            "promote_to_main": "git checkout main && git merge --no-ff <validated-branch>",
            "start_runtime": "pnpm prod:start",
            "status": "pnpm prod:status",
            "check": "pnpm prod:check",
            "rollback": "node --experimental-strip-types scripts/release/rollback-release.ts --release <releaseId>",
        },
    }


def normalize_string(value: Any, fallback: str = "") -> str:
    if isinstance(value, str):
        return value.strip()
    if value is None:
        return fallback
    return str(value).strip()


def normalize_notes(value: Any, fallback: list[str]) -> list[str]:
    if isinstance(value, list):
        notes = [normalize_string(item) for item in value if normalize_string(item)]
        return notes or fallback
    note = normalize_string(value)
    return [note] if note else fallback


def normalize_server_surface(payload: Any, fallback: dict[str, Any]) -> dict[str, Any]:
    current = payload if isinstance(payload, dict) else {}
    auth = current.get("auth") if isinstance(current.get("auth"), dict) else {}
    commands = current.get("commands") if isinstance(current.get("commands"), dict) else {}
    return {
        "surface_id": normalize_string(current.get("surface_id"), fallback["surface_id"]),
        "purpose": normalize_string(current.get("purpose"), fallback["purpose"]),
        "enabled": bool(current.get("enabled")) if "enabled" in current else bool(fallback["enabled"]),
        "transport": normalize_string(current.get("transport"), fallback["transport"]),
        "host": normalize_string(current.get("host"), fallback["host"]),
        "port": int(current.get("port")) if isinstance(current.get("port"), int) else int(fallback["port"]),
        "base_url": normalize_string(current.get("base_url"), fallback["base_url"]),
        "access_via": normalize_string(current.get("access_via"), fallback["access_via"]),
        "auth": {
            "mode": normalize_string(auth.get("mode"), fallback["auth"]["mode"]),
            "secret_refs": [normalize_string(item) for item in auth.get("secret_refs", fallback["auth"]["secret_refs"]) if normalize_string(item)],
        },
        "commands": {
            "start": normalize_string(commands.get("start"), fallback["commands"]["start"]),
            "stop": normalize_string(commands.get("stop"), fallback["commands"]["stop"]),
            "status": normalize_string(commands.get("status"), fallback["commands"]["status"]),
            "check": normalize_string(commands.get("check"), fallback["commands"]["check"]),
        },
        "notes": normalize_notes(current.get("notes"), fallback["notes"]),
    }


def normalize_github_surface(payload: Any, fallback: dict[str, Any]) -> dict[str, Any]:
    current = payload if isinstance(payload, dict) else {}
    auth = current.get("auth") if isinstance(current.get("auth"), dict) else {}
    commands = current.get("commands") if isinstance(current.get("commands"), dict) else {}
    return {
        "enabled": bool(current.get("enabled")) if "enabled" in current else bool(fallback["enabled"]),
        "provider": "github",
        "owner": normalize_string(current.get("owner"), fallback["owner"]),
        "repo": normalize_string(current.get("repo"), fallback["repo"]),
        "remote_name": normalize_string(current.get("remote_name"), fallback["remote_name"]),
        "default_branch": normalize_string(current.get("default_branch"), fallback["default_branch"]),
        "auth": {
            "mode": normalize_string(auth.get("mode"), fallback["auth"]["mode"]),
            "secret_refs": [normalize_string(item) for item in auth.get("secret_refs", fallback["auth"]["secret_refs"]) if normalize_string(item)],
        },
        "commands": {
            "status": normalize_string(commands.get("status"), fallback["commands"]["status"]),
            "sync": normalize_string(commands.get("sync"), fallback["commands"]["sync"]),
            "open_pr": normalize_string(commands.get("open_pr"), fallback["commands"]["open_pr"]),
            "checks": normalize_string(commands.get("checks"), fallback["commands"]["checks"]),
        },
        "required_checks": [normalize_string(item) for item in current.get("required_checks", fallback["required_checks"]) if normalize_string(item)],
        "notes": normalize_notes(current.get("notes"), fallback["notes"]),
    }


def normalize_operator_payload(payload: dict[str, Any], target: Path) -> tuple[dict[str, Any], bool]:
    template = load_yaml(SOURCE_ROOT / PROJECT_OPERATOR_TEMPLATE_PATH)
    if not isinstance(template, dict):
        raise ValueError("Project operator template must be an object.")

    server_defaults = default_server_surfaces(target)
    server_by_id = {
        normalize_string(item.get("surface_id")): item
        for item in (payload.get("server_surfaces") if isinstance(payload.get("server_surfaces"), list) else [])
        if isinstance(item, dict) and normalize_string(item.get("surface_id"))
    }
    normalized_surfaces = [normalize_server_surface(server_by_id.get(item["surface_id"]), item) for item in server_defaults]
    for item in payload.get("server_surfaces", []) if isinstance(payload.get("server_surfaces"), list) else []:
        if not isinstance(item, dict):
            continue
        surface_id = normalize_string(item.get("surface_id"))
        if not surface_id or surface_id in {entry["surface_id"] for entry in normalized_surfaces}:
            continue
        normalized_surfaces.append(
            normalize_server_surface(
                item,
                {
                    "surface_id": surface_id,
                    "purpose": normalize_string(item.get("purpose"), "admin"),
                    "enabled": bool(item.get("enabled")),
                    "transport": normalize_string(item.get("transport"), "ssh"),
                    "host": normalize_string(item.get("host")),
                    "port": int(item.get("port")) if isinstance(item.get("port"), int) else 0,
                    "base_url": normalize_string(item.get("base_url")),
                    "access_via": normalize_string(item.get("access_via")),
                    "auth": {"mode": "manual", "secret_refs": []},
                    "commands": {"start": "", "stop": "", "status": "", "check": ""},
                    "notes": ["项目自定义访问面。"],
                },
            )
        )

    standard_flows = deepcopy(default_standard_flows())
    current_flows = payload.get("standard_flows") if isinstance(payload.get("standard_flows"), dict) else {}
    for group, commands in standard_flows.items():
        current_group = current_flows.get(group) if isinstance(current_flows.get(group), dict) else {}
        for key, default_command in commands.items():
            commands[key] = normalize_string(current_group.get(key), default_command)

    normalized = {
        "version": normalize_string(payload.get("version"), normalize_string(template.get("version"), "0.1.0")),
        "project": {
            "name": normalize_string(
                payload.get("project", {}).get("name") if isinstance(payload.get("project"), dict) else "",
                infer_project_name(target),
            )
        },
        "server_surfaces": normalized_surfaces,
        "github_surface": normalize_github_surface(payload.get("github_surface"), default_github_surface(target)),
        "standard_flows": standard_flows,
        "notes": normalize_notes(
            payload.get("notes"),
            [
                "该文件只保存服务器访问面、GitHub 接入面和标准发布流的非密钥事实。",
                "真实密钥只放在 env、gh auth、ssh config 或外部 secret manager。",
                "人类扫读版由 docs/OPERATOR_RUNBOOK.md 承接；跨工具薄入口只负责把工具跳转到 AGENTS.md 与本文件。",
            ],
        ),
    }
    return normalized, normalized != payload


def validate_operator_contract_payload(payload: dict[str, Any]) -> dict[str, Any]:
    schema = load_yaml(SOURCE_ROOT / PROJECT_OPERATOR_SCHEMA_PATH)
    if not isinstance(schema, dict):
        raise ValueError("Project operator schema must be an object.")
    errors = validate_payload(payload, schema)
    field_errors = {error.split(":")[0].replace("root.", "", 1): error for error in errors}
    return {
        "ok": not errors,
        "message": "Operator contract valid." if not errors else "Operator contract validation failed.",
        "field_errors": field_errors,
    }


def ensure_operator_contract(target: Path) -> tuple[Path, dict[str, Any], bool]:
    path = target / PROJECT_OPERATOR_PATH
    existed = path.exists()
    payload = load_yaml(path) if existed else {}
    if payload and not isinstance(payload, dict):
        raise ValueError("Project operator contract must be an object.")
    normalized, changed = normalize_operator_payload(payload if isinstance(payload, dict) else {}, target)
    if not existed or changed:
        save_yaml(path, normalized)
    return path, normalized, (not existed) or changed


__all__ = [
    "default_github_surface",
    "default_server_surfaces",
    "default_standard_flows",
    "ensure_operator_contract",
    "normalize_operator_payload",
    "validate_operator_contract_payload",
]
