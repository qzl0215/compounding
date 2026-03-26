from __future__ import annotations

import json
import subprocess
from copy import deepcopy
from pathlib import Path
from typing import Any

from .config_resolution import infer_app_type, infer_kernel_profile, infer_package_manager, infer_project_name
from .defaults import BRIEF_PATH, PROJECT_OPERATOR_PATH, PROJECT_OPERATOR_SCHEMA_PATH, PROJECT_OPERATOR_TEMPLATE_PATH, SOURCE_ROOT
from .packs import infer_adapter_id, infer_bootstrap_mode, load_kernel_manifest, mode_required_packs, resolve_supported_mode
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


def default_standard_flows(has_ai_exec_pack: bool) -> dict[str, Any]:
    preflight_basic = "node --experimental-strip-types scripts/coord/preflight.ts" if has_ai_exec_pack else "python3 scripts/init_project_compounding.py doctor --target ."
    preflight_task = (
        "node --experimental-strip-types scripts/coord/preflight.ts --taskId=t-xxx"
        if has_ai_exec_pack
        else "python3 scripts/init_project_compounding.py audit --target ."
    )
    return {
        "preflight": {
            "basic": preflight_basic,
            "task": preflight_task,
        },
        "preview_release": {
            "prepare": "python3 scripts/init_project_compounding.py proposal --target .",
            "accept": "python3 scripts/init_project_compounding.py audit --target .",
            "reject": "python3 scripts/init_project_compounding.py doctor --target .",
        },
        "production_release": {
            "promote_to_main": "git checkout main && git merge --no-ff <validated-branch>",
            "start_runtime": "python3 scripts/init_project_compounding.py doctor --target .",
            "status": "python3 scripts/init_project_compounding.py doctor --target .",
            "check": "python3 scripts/init_project_compounding.py audit --target .",
            "rollback": "git revert <commit>",
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


def infer_project_profile(target: Path) -> str:
    brief_path = target / BRIEF_PATH
    if brief_path.exists():
        payload = load_yaml(brief_path)
        if isinstance(payload, dict):
            kernel = payload.get("kernel") if isinstance(payload.get("kernel"), dict) else {}
            profile = normalize_string(kernel.get("profile"))
            if profile:
                return profile
    return infer_kernel_profile(target)


def infer_project_bootstrap_mode(target: Path) -> str:
    manifest = load_kernel_manifest()
    brief_path = target / BRIEF_PATH
    if brief_path.exists():
        payload = load_yaml(brief_path)
        if isinstance(payload, dict):
            mode = normalize_string(payload.get("bootstrap_mode"))
            kernel = payload.get("kernel") if isinstance(payload.get("kernel"), dict) else {}
            runtime_boundary = payload.get("runtime_boundary") if isinstance(payload.get("runtime_boundary"), dict) else {}
            profile = normalize_string(kernel.get("profile"))
            app_type = normalize_string(runtime_boundary.get("app_type"))
            inferred_app_type = app_type or infer_app_type(target)
            inferred_mode = infer_bootstrap_mode(target, inferred_app_type, profile or infer_kernel_profile(target))
            return resolve_supported_mode(manifest, infer_adapter_id(inferred_app_type), mode or inferred_mode, inferred_mode)
    inferred_app_type = infer_app_type(target)
    inferred_mode = infer_bootstrap_mode(target, inferred_app_type, infer_kernel_profile(target))
    return resolve_supported_mode(manifest, infer_adapter_id(inferred_app_type), inferred_mode, inferred_mode)


def infer_required_packs(target: Path, bootstrap_mode: str) -> list[str]:
    return mode_required_packs(load_kernel_manifest(), bootstrap_mode)


def default_toolchain_commands(target: Path, adapter_id: str, has_ai_exec_pack: bool) -> dict[str, str]:
    package_manager = infer_package_manager(target)
    install = ""
    dev = ""
    build = ""
    test = ""

    if adapter_id in {"node_service", "web_app"}:
        if package_manager == "pnpm":
            install, dev, build, test = "pnpm install", "pnpm dev", "pnpm build", "pnpm test"
        elif package_manager == "yarn":
            install, dev, build, test = "yarn install", "yarn dev", "yarn build", "yarn test"
        elif package_manager == "npm":
            install, dev, build, test = "npm install", "npm run dev", "npm run build", "npm test"
        elif package_manager == "bun":
            install, dev, build, test = "bun install", "bun run dev", "bun run build", "bun test"
    elif adapter_id == "python_service":
        install = "pip install -r requirements.txt"
        dev = "python -m app"
        build = "python -m compileall ."
        test = "pytest"

    return {
        "install": install,
        "dev": dev,
        "build": build,
        "test": test,
        "bootstrap_doctor": "python3 scripts/init_project_compounding.py doctor --target .",
        "bootstrap_attach": "python3 scripts/init_project_compounding.py attach --target .",
        "bootstrap_audit": "python3 scripts/init_project_compounding.py audit --target .",
        "bootstrap_proposal": "python3 scripts/init_project_compounding.py proposal --target .",
        "preflight": "node --experimental-strip-types scripts/coord/preflight.ts" if has_ai_exec_pack else "python3 scripts/init_project_compounding.py doctor --target .",
        "task_preflight": "node --experimental-strip-types scripts/coord/preflight.ts --taskId=t-xxx" if has_ai_exec_pack else "python3 scripts/init_project_compounding.py audit --target .",
        "create_task": "node --experimental-strip-types scripts/ai/create-task.ts task-xxx \"中文直给概述\" \"为什么现在\"" if has_ai_exec_pack else "",
        "review": "node --experimental-strip-types scripts/coord/review.ts --taskId=t-xxx" if has_ai_exec_pack else "",
    }


def normalize_toolchain_commands(payload: Any, fallback: dict[str, str]) -> dict[str, str]:
    current = payload if isinstance(payload, dict) else {}
    return {key: normalize_string(current.get(key), value) for key, value in fallback.items()}


def sync_operator_assets(target: Path) -> bool:
    script_path = target / "scripts" / "ai" / "generate-operator-assets.ts"
    if not script_path.exists():
        return False
    subprocess.run(
        ["node", "--experimental-strip-types", str(script_path)],
        cwd=target,
        capture_output=True,
        text=True,
        check=True,
    )
    return True


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

    bootstrap_mode = infer_project_bootstrap_mode(target)
    adapter_id = infer_adapter_id(infer_app_type(target))
    required_packs = infer_required_packs(target, bootstrap_mode)
    has_ai_exec_pack = "ai_exec_pack" in required_packs

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

    standard_flows = deepcopy(default_standard_flows(has_ai_exec_pack))
    current_flows = payload.get("standard_flows") if isinstance(payload.get("standard_flows"), dict) else {}
    for group, commands in standard_flows.items():
        current_group = current_flows.get(group) if isinstance(current_flows.get(group), dict) else {}
        for key, default_command in commands.items():
            commands[key] = normalize_string(current_group.get(key), default_command)

    toolchain_commands = normalize_toolchain_commands(
        payload.get("toolchain_commands"),
        default_toolchain_commands(target, adapter_id, has_ai_exec_pack),
    )

    normalized_shortcuts = []
    shortcut_values = payload.get("agent_shortcuts") if isinstance(payload.get("agent_shortcuts"), list) else template.get("agent_shortcuts", [])
    for item in shortcut_values if isinstance(shortcut_values, list) else []:
        if not isinstance(item, dict):
            continue
        tool_surfaces = item.get("tool_surfaces") if isinstance(item.get("tool_surfaces"), list) else []
        normalized_shortcuts.append(
            {
                "shortcut_id": normalize_string(item.get("shortcut_id")),
                "label": normalize_string(item.get("label")),
                "canonical_command": normalize_string(item.get("canonical_command")),
                "applies_when": normalize_string(item.get("applies_when")),
                "why": normalize_string(item.get("why")),
                "tool_surfaces": [normalize_string(surface) for surface in tool_surfaces if normalize_string(surface)],
                "mode": normalize_string(item.get("mode"), "suggest"),
            }
        )

    normalized = {
        "version": normalize_string(payload.get("version"), normalize_string(template.get("version"), "0.1.0")),
        "project": {
            "name": normalize_string(
                payload.get("project", {}).get("name") if isinstance(payload.get("project"), dict) else "",
                infer_project_name(target),
            ),
            "bootstrap_mode": bootstrap_mode,
            "adapter_id": adapter_id,
            "profile": infer_project_profile(target),
            "required_packs": required_packs,
        },
        "toolchain_commands": toolchain_commands,
        "server_surfaces": normalized_surfaces,
        "github_surface": normalize_github_surface(payload.get("github_surface"), default_github_surface(target)),
        "standard_flows": standard_flows,
        "agent_shortcuts": normalized_shortcuts,
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
    "sync_operator_assets",
    "normalize_operator_payload",
    "validate_operator_contract_payload",
]
