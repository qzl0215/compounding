from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .defaults import (
    BOOTSTRAP_DIR,
    BRIEF_PATH,
    DEFAULT_AUTO_APPLY_PATHS,
    DEFAULT_BLOCKED_PATHS,
    DEFAULT_OWNED_PATHS,
    DEFAULT_PROPOSAL_REQUIRED_PATHS,
    DEFAULT_PROTECTED_RULES,
    KERNEL_MANIFEST_PATH,
    KERNEL_VERSION,
    LEGACY_CONFIG_PATH,
    PROJECT_BRIEF_SCHEMA_PATH,
    PROJECT_BRIEF_TEMPLATE_PATH,
    RESOLVED_CONFIG_PATH,
    SOURCE_ROOT,
)
from .packs import infer_adapter_id, infer_bootstrap_mode, load_kernel_manifest, mode_default_profile, resolve_supported_mode
from .repo_scan import scan_repo, slugify
from .schema_validation import validate_payload
from .yaml_io import load_yaml, save_yaml

GENERIC_ONE_LINERS = {
    "一个已经接入 kernel + shell 协议的项目壳子。",
    "把现有项目接入单主干 kernel + project shell 的个人 AI 工程底盘。",
    "把当前仓库升级成适合 AI 长期协作、任务驱动、可持续重构与自进化的 AI-Native Repo。",
}

GENERIC_APP_TYPES = {
    "",
    "project-shell",
}

GENERIC_KERNEL_PROFILES = {
    "",
    "protocol_only",
}

GENERIC_BOOTSTRAP_MODES = {
    "",
    "cold_start",
}

GENERIC_DEPLOY_TARGETS = {
    "",
    "unknown",
    "custom-deploy",
}

GENERIC_CRITICAL_PATHS = {
    "AGENTS.md",
    "memory/project/operating-blueprint.md",
    "scripts/compounding_bootstrap/*",
}


def source_project_identity() -> tuple[str, str]:
    path = SOURCE_ROOT / BRIEF_PATH
    if not path.exists():
        return "", ""
    payload = load_yaml(path)
    if not isinstance(payload, dict):
        return "", ""
    project_identity = payload.get("project_identity") if isinstance(payload.get("project_identity"), dict) else {}
    return str(project_identity.get("name") or "").strip(), str(project_identity.get("one_liner") or "").strip()


def load_package_json(target: Path) -> dict[str, Any]:
    path = target / "package.json"
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf8"))
    except json.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}


def has_dependency(package_json: dict[str, Any], package_name: str) -> bool:
    for section in ("dependencies", "devDependencies", "peerDependencies"):
        deps = package_json.get(section)
        if isinstance(deps, dict) and package_name in deps:
            return True
    return False


def text_contains(target: Path, relative_path: str, needles: list[str]) -> bool:
    path = target / relative_path
    if not path.exists():
        return False
    content = path.read_text(encoding="utf8").lower()
    return any(needle.lower() in content for needle in needles)


def default_brief_payload(project_name: str, adoption_mode: str = "attach", bootstrap_mode: str = "normalize") -> dict[str, Any]:
    template = load_yaml(SOURCE_ROOT / PROJECT_BRIEF_TEMPLATE_PATH)
    if not isinstance(template, dict):
        raise ValueError("Project brief template must be a mapping.")
    payload = dict(template)
    payload["bootstrap_mode"] = bootstrap_mode
    payload["project_identity"] = dict(payload.get("project_identity") or {})
    payload["project_identity"]["name"] = project_name
    payload["kernel"] = dict(payload.get("kernel") or {})
    payload["kernel"]["version"] = kernel_version()
    payload["kernel"]["adoption_mode"] = adoption_mode
    return payload


def kernel_version() -> str:
    manifest = load_yaml(SOURCE_ROOT / KERNEL_MANIFEST_PATH)
    if isinstance(manifest, dict) and isinstance(manifest.get("version"), str):
        return manifest["version"]
    return KERNEL_VERSION


def split_success_criteria(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if value is None:
        return []
    text = str(value).strip()
    if not text:
        return []
    return [segment.strip() for segment in text.replace("；", "\n").replace("。", "\n").splitlines() if segment.strip()]


def infer_one_liner(target: Path, payload: dict[str, Any] | None = None) -> str:
    existing = payload or {}
    project_identity = existing.get("project_identity") if isinstance(existing.get("project_identity"), dict) else {}
    _, source_one_liner = source_project_identity()
    candidates = [
        project_identity.get("one_liner"),
        existing.get("project_one_liner"),
    ]
    for candidate in candidates:
        if isinstance(candidate, str):
            value = candidate.strip()
            if target.resolve() != SOURCE_ROOT and source_one_liner and value == source_one_liner:
                continue
            if value and value not in GENERIC_ONE_LINERS:
                return value
    readme_path = target / "README.md"
    if readme_path.exists():
        for raw in readme_path.read_text(encoding="utf8").splitlines():
            line = raw.strip()
            if line and not line.startswith("#") and not line.startswith("```"):
                return line
    return "把现有项目接入单主干 kernel + project shell 的个人 AI 工程底盘。"


def infer_project_name(target: Path, payload: dict[str, Any] | None = None) -> str:
    existing = payload or {}
    project_identity = existing.get("project_identity") if isinstance(existing.get("project_identity"), dict) else {}
    source_name, _ = source_project_identity()
    candidates = [
        project_identity.get("name"),
        existing.get("project_name"),
        target.resolve().name.replace("-", " ").replace("_", " ").strip(),
    ]
    for candidate in candidates:
        if isinstance(candidate, str) and candidate.strip():
            value = candidate.strip()
            if target.resolve() != SOURCE_ROOT and source_name and value == source_name:
                continue
            return value
    return "Untitled Project"


def infer_deploy_target(target: Path) -> str:
    package_json = load_package_json(target)
    if (target / "vercel.json").exists() or (target / ".vercel").exists():
        return "vercel"
    if (target / "netlify.toml").exists():
        return "netlify"
    if has_dependency(package_json, "next"):
        if text_contains(target, "next.config.ts", ['output: "export"', "output: 'export'"]) and (
            (target / "deploy").exists() or text_contains(target, "README.md", ["nginx", "静态导出"])
        ):
            return "nginx-static-export"
        return "next-runtime"
    if (target / "Dockerfile").exists() or (target / "docker-compose.yml").exists() or (target / "compose.yaml").exists():
        return "container-service"
    if (target / "scripts" / "local-runtime").exists():
        return "local-runtime"
    if (target / "deploy").exists():
        return "custom-deploy"
    return "unknown"


def infer_app_type(target: Path) -> str:
    package_json = load_package_json(target)
    if (target / "pyproject.toml").exists() or (target / "requirements.txt").exists():
        if any((target / path).exists() for path in ("src", "app", "services")):
            return "python-service"
        return "python-package"
    if has_dependency(package_json, "next"):
        if text_contains(target, "next.config.ts", ['output: "export"', "output: 'export'"]):
            return "nextjs-static-site"
        return "nextjs-app"
    if any(has_dependency(package_json, dep) for dep in ("react", "vue", "svelte", "vite")):
        return "web-app"
    scripts = package_json.get("scripts") if isinstance(package_json.get("scripts"), dict) else {}
    if package_json and any(key in scripts for key in ("dev", "start", "build", "test")):
        return "node-service"
    if package_json:
        return "javascript-package"
    if (target / "apps").exists() and (target / "tasks").exists() and (target / "memory").exists():
        return "ai-native-repo"
    if (target / "apps").exists():
        return "application"
    return "project-shell"


def should_refresh_app_type(target: Path, current_app_type: str) -> bool:
    value = current_app_type.strip()
    inferred = infer_app_type(target)
    if value in GENERIC_APP_TYPES:
        return True
    return value != inferred


def infer_critical_paths(target: Path) -> list[str]:
    paths = [
        "AGENTS.md",
        "README.md",
        "docs/PROJECT_RULES.md",
        "docs/ARCHITECTURE.md",
        "memory/project/roadmap.md",
        "memory/project/current-state.md",
        "memory/project/operating-blueprint.md",
        "scripts/compounding_bootstrap/*",
    ]
    if (target / "src" / "app").exists():
        paths.append("src/app/**")
    if (target / "src" / "modules").exists():
        paths.append("src/modules/**")
    if (target / "deploy").exists():
        paths.append("deploy/**")
    return [path for path in paths if _path_exists_for_pattern(target, path)]


def should_refresh_critical_paths(target: Path, current_paths: Any) -> bool:
    if not isinstance(current_paths, list) or not current_paths:
        return True
    normalized = [str(item).strip() for item in current_paths if str(item).strip()]
    if not normalized:
        return True
    if set(normalized).issubset(GENERIC_CRITICAL_PATHS):
        if (target / "src" / "app").exists() or (target / "src" / "modules").exists() or (target / "deploy").exists():
            return True
    detected = infer_critical_paths(target)
    if any(path not in normalized for path in detected):
        return True
    return False


def infer_owned_paths(target: Path) -> list[str]:
    candidates = [
        "memory/**",
        "tasks/queue/**",
        "apps/**",
        "src/**",
        "app/**",
        "pages/**",
        "components/**",
        "lib/**",
        "public/**",
        "code_index/**",
    ]
    owned = [pattern for pattern in candidates if _path_exists_for_pattern(target, pattern)]
    return owned or DEFAULT_OWNED_PATHS.copy()


def infer_kernel_profile(target: Path, app_type: str | None = None) -> str:
    detected_app_type = app_type or infer_app_type(target)
    execution_markers = (
        target / "scripts" / "coord" / "preflight.ts",
        target / "scripts" / "coord" / "task.ts",
        target / "scripts" / "coord" / "review.ts",
    )
    if all(marker.exists() for marker in execution_markers):
        return "full_ai_dev"
    if detected_app_type in {"ai-native-repo", "nextjs-app", "nextjs-static-site", "web-app", "node-service", "python-service", "application"}:
        return "governance"
    if any((target / path).exists() for path in ("README.md", "package.json", "pyproject.toml", "requirements.txt", "src", "app", "apps")):
        return "governance"
    return "protocol_only"


def should_refresh_bootstrap_mode(target: Path, current_mode: str, app_type: str | None = None, profile: str | None = None) -> bool:
    value = current_mode.strip()
    inferred = infer_bootstrap_mode(target, app_type or infer_app_type(target), profile or infer_kernel_profile(target, app_type))
    if value in GENERIC_BOOTSTRAP_MODES:
        return True
    return value != inferred


def should_refresh_kernel_profile(target: Path, current_profile: str, app_type: str | None = None) -> bool:
    value = current_profile.strip()
    inferred = infer_kernel_profile(target, app_type)
    if value in GENERIC_KERNEL_PROFILES:
        return True
    return value != inferred


def infer_package_manager(target: Path) -> str:
    if (target / "pnpm-lock.yaml").exists():
        return "pnpm"
    if (target / "yarn.lock").exists():
        return "yarn"
    if (target / "package-lock.json").exists():
        return "npm"
    if (target / "bun.lockb").exists() or (target / "bun.lock").exists():
        return "bun"
    if (target / "uv.lock").exists():
        return "uv"
    if (target / "poetry.lock").exists():
        return "poetry"
    if (target / "pyproject.toml").exists() or (target / "requirements.txt").exists():
        return "pip"
    return "unknown"


def should_refresh_owned_paths(target: Path, current_paths: Any) -> bool:
    if not isinstance(current_paths, list) or not current_paths:
        return True
    normalized = [str(item).strip() for item in current_paths if str(item).strip()]
    if not normalized:
        return True
    if normalized == DEFAULT_OWNED_PATHS:
        return True
    if "apps/**" in normalized and not _path_exists_for_pattern(target, "apps/**"):
        if any(_path_exists_for_pattern(target, path) for path in ("src/**", "app/**", "pages/**", "components/**", "lib/**")):
            return True
    return False


def infer_blocked_paths(target: Path) -> list[str]:
    candidates = [
        "src/**",
        "app/**",
        "pages/**",
        "components/**",
        "lib/**",
        "public/**",
        "scripts/release/**",
        "scripts/local-runtime/**",
        "deploy/**",
        ".github/workflows/**",
    ]
    blocked = [pattern for pattern in candidates if _path_exists_for_pattern(target, pattern)]
    return blocked or DEFAULT_BLOCKED_PATHS.copy()


def should_refresh_deploy_target(target: Path, current_deploy_target: str) -> bool:
    value = current_deploy_target.strip()
    inferred = infer_deploy_target(target)
    if value in GENERIC_DEPLOY_TARGETS:
        return True
    return value != inferred


def should_refresh_blocked_paths(target: Path, current_paths: Any) -> bool:
    if not isinstance(current_paths, list) or not current_paths:
        return True
    normalized = [str(item).strip() for item in current_paths if str(item).strip()]
    if not normalized:
        return True
    if normalized == DEFAULT_BLOCKED_PATHS:
        return True
    if "apps/**" in normalized and not _path_exists_for_pattern(target, "apps/**"):
        if any(_path_exists_for_pattern(target, path) for path in ("src/**", "app/**", "pages/**", "components/**", "lib/**")):
            return True
    detected = infer_blocked_paths(target)
    if any(path not in normalized for path in detected):
        return True
    return False


def _path_exists_for_pattern(target: Path, pattern: str) -> bool:
    if "*" in pattern:
        return any(target.glob(pattern))
    return (target / pattern).exists()


def is_new_brief(payload: dict[str, Any]) -> bool:
    return isinstance(payload.get("project_identity"), dict) and isinstance(payload.get("kernel"), dict)


def normalize_brief_payload(
    payload: dict[str, Any],
    target: Path,
    adoption_mode: str = "attach",
    bootstrap_mode: str | None = None,
) -> tuple[dict[str, Any], bool]:
    inferred_app_type = infer_app_type(target)
    inferred_profile = infer_kernel_profile(target, inferred_app_type)
    manifest = load_kernel_manifest()
    resolved_bootstrap_mode = bootstrap_mode or infer_bootstrap_mode(target, inferred_app_type, inferred_profile)
    normalized = default_brief_payload(infer_project_name(target, payload), adoption_mode=adoption_mode, bootstrap_mode=resolved_bootstrap_mode)
    migrated = not is_new_brief(payload)
    current_bootstrap_mode = str(payload.get("bootstrap_mode") or "").strip()
    normalized["bootstrap_mode"] = (
        infer_bootstrap_mode(target, inferred_app_type, inferred_profile)
        if should_refresh_bootstrap_mode(target, current_bootstrap_mode, inferred_app_type, inferred_profile)
        else current_bootstrap_mode
    )

    project_identity = payload.get("project_identity") if isinstance(payload.get("project_identity"), dict) else {}
    normalized["project_identity"] = {
        "name": infer_project_name(target, payload),
        "one_liner": infer_one_liner(target, payload),
        "success_criteria": split_success_criteria(
            project_identity.get("success_criteria") or payload.get("success_definition") or payload.get("north_star_metric")
        )
        or ["项目进入统一的 plan / task / release / memory 协议，并能稳定运行 attach / audit / proposal / bootstrap。"],
    }

    runtime_boundary = payload.get("runtime_boundary") if isinstance(payload.get("runtime_boundary"), dict) else {}
    current_app_type = str(runtime_boundary.get("app_type") or "").strip()
    current_deploy_target = str(runtime_boundary.get("deploy_target") or "").strip()
    normalized["runtime_boundary"] = {
        "app_type": inferred_app_type if should_refresh_app_type(target, current_app_type) else current_app_type,
        "deploy_target": infer_deploy_target(target)
        if should_refresh_deploy_target(target, current_deploy_target)
        else current_deploy_target,
        "critical_paths": infer_critical_paths(target)
        if should_refresh_critical_paths(target, runtime_boundary.get("critical_paths"))
        else runtime_boundary.get("critical_paths"),
    }
    normalized["bootstrap_mode"] = resolve_supported_mode(
        manifest,
        infer_adapter_id(normalized["runtime_boundary"]["app_type"]),
        normalized["bootstrap_mode"],
        infer_bootstrap_mode(target, normalized["runtime_boundary"]["app_type"], inferred_profile),
    )

    kernel = payload.get("kernel") if isinstance(payload.get("kernel"), dict) else {}
    current_profile = str(kernel.get("profile") or "").strip()
    resolved_profile = current_profile
    if should_refresh_kernel_profile(target, current_profile, normalized["runtime_boundary"]["app_type"]):
        resolved_profile = mode_default_profile(manifest, normalized["bootstrap_mode"])
    elif not resolved_profile:
        resolved_profile = inferred_profile
    normalized["kernel"] = {
        "version": str(kernel.get("version") or kernel_version()),
        "adoption_mode": str(kernel.get("adoption_mode") or adoption_mode),
        "profile": resolved_profile,
    }

    local_overrides = payload.get("local_overrides") if isinstance(payload.get("local_overrides"), dict) else {}
    normalized["local_overrides"] = {
        "owned_paths": infer_owned_paths(target)
        if should_refresh_owned_paths(target, local_overrides.get("owned_paths"))
        else local_overrides.get("owned_paths"),
        "protected_rules": local_overrides.get("protected_rules") or DEFAULT_PROTECTED_RULES.copy(),
    }

    upgrade_policy = payload.get("upgrade_policy") if isinstance(payload.get("upgrade_policy"), dict) else {}
    normalized["upgrade_policy"] = {
        "auto_apply_paths": upgrade_policy.get("auto_apply_paths") or DEFAULT_AUTO_APPLY_PATHS.copy(),
        "proposal_required_paths": upgrade_policy.get("proposal_required_paths") or DEFAULT_PROPOSAL_REQUIRED_PATHS.copy(),
        "blocked_paths": infer_blocked_paths(target)
        if should_refresh_blocked_paths(target, upgrade_policy.get("blocked_paths"))
        else upgrade_policy.get("blocked_paths"),
    }
    return normalized, migrated


def validate_brief_payload(payload: dict[str, Any]) -> dict[str, Any]:
    schema = load_yaml(SOURCE_ROOT / PROJECT_BRIEF_SCHEMA_PATH)
    errors = validate_payload(payload, schema)
    field_errors = {error.split(":")[0].replace("root.", "", 1): error for error in errors}
    return {
        "ok": not errors,
        "message": "Config valid." if not errors else "Config validation failed.",
        "field_errors": field_errors,
    }


def validate_config_file(config_path: Path, target: Path) -> dict[str, Any]:
    path = config_path if config_path.exists() else target / BRIEF_PATH
    if not path.exists():
        path = migrate_legacy_config(target)
    payload = load_yaml(path)
    if not isinstance(payload, dict):
        return {"ok": False, "message": "Config must be an object.", "field_errors": {"root": "Config must be an object."}}
    normalized, _ = normalize_brief_payload(payload, target)
    return validate_brief_payload(normalized)


def migrate_legacy_config(target: Path, adoption_mode: str = "attach", bootstrap_mode: str | None = None) -> Path:
    brief_path = target / BRIEF_PATH
    if brief_path.exists():
        payload = load_yaml(brief_path)
        if isinstance(payload, dict):
            normalized, migrated = normalize_brief_payload(payload, target, adoption_mode=adoption_mode, bootstrap_mode=bootstrap_mode)
            if migrated:
                save_yaml(brief_path, normalized)
        return brief_path

    legacy_path = target / LEGACY_CONFIG_PATH
    if legacy_path.exists():
        payload = load_yaml(legacy_path)
        if not isinstance(payload, dict):
            raise ValueError(f"Legacy config must be an object: {legacy_path}")
        normalized, _ = normalize_brief_payload(payload, target, adoption_mode=adoption_mode, bootstrap_mode=bootstrap_mode)
        save_yaml(brief_path, normalized)
        return brief_path

    brief_path.parent.mkdir(parents=True, exist_ok=True)
    inferred_app_type = infer_app_type(target)
    inferred_profile = infer_kernel_profile(target, inferred_app_type)
    manifest = load_kernel_manifest()
    resolved_bootstrap_mode = resolve_supported_mode(
        manifest,
        infer_adapter_id(inferred_app_type),
        bootstrap_mode or infer_bootstrap_mode(target, inferred_app_type, inferred_profile),
        infer_bootstrap_mode(target, inferred_app_type, inferred_profile),
    )
    normalized = default_brief_payload(infer_project_name(target), adoption_mode=adoption_mode, bootstrap_mode=resolved_bootstrap_mode)
    normalized["project_identity"]["one_liner"] = infer_one_liner(target, normalized)
    normalized["runtime_boundary"]["app_type"] = inferred_app_type
    normalized["runtime_boundary"]["deploy_target"] = infer_deploy_target(target)
    normalized["runtime_boundary"]["critical_paths"] = infer_critical_paths(target)
    normalized["kernel"]["profile"] = mode_default_profile(manifest, resolved_bootstrap_mode)
    save_yaml(brief_path, normalized)
    return brief_path


def ensure_brief(
    config_path: Path | None,
    target: Path,
    adoption_mode: str = "attach",
    bootstrap_mode: str | None = None,
) -> tuple[Path, dict[str, Any], bool]:
    path = config_path if config_path and config_path.exists() else target / BRIEF_PATH
    created = False
    if not path.exists():
        path = migrate_legacy_config(target, adoption_mode=adoption_mode, bootstrap_mode=bootstrap_mode)
        created = True
    payload = load_yaml(path)
    if not isinstance(payload, dict):
        raise ValueError("Project brief must be an object.")
    normalized, migrated = normalize_brief_payload(payload, target, adoption_mode=adoption_mode, bootstrap_mode=bootstrap_mode)
    if created or migrated or normalized != payload:
        save_yaml(path, normalized)
    return path, normalized, created or migrated


def resolve_project_config(brief_path: Path, target: Path) -> dict[str, Any]:
    payload = load_yaml(brief_path)
    if not isinstance(payload, dict):
        raise ValueError("Project brief must be an object.")
    normalized, _ = normalize_brief_payload(payload, target)
    scan = scan_repo(target)
    resolved = {
        "bootstrap_mode": normalized["bootstrap_mode"],
        "project_name": normalized["project_identity"]["name"],
        "project_slug": slugify(normalized["project_identity"]["name"]),
        "project_one_liner": normalized["project_identity"]["one_liner"],
        "success_criteria": normalized["project_identity"]["success_criteria"],
        "kernel_version": normalized["kernel"]["version"],
        "adoption_mode": normalized["kernel"]["adoption_mode"],
        "kernel_profile": normalized["kernel"]["profile"],
        "adapter_id": infer_adapter_id(normalized["runtime_boundary"]["app_type"]),
        "app_type": normalized["runtime_boundary"]["app_type"],
        "deploy_target": normalized["runtime_boundary"]["deploy_target"],
        "package_manager": infer_package_manager(target),
        "critical_paths": normalized["runtime_boundary"]["critical_paths"],
        "repo_scan": scan,
        "allowed_scopes": [
            "apps/**",
            "scripts/**",
            "docs/**",
            "memory/**",
            "code_index/**",
            "tasks/**",
            f"{BOOTSTRAP_DIR}/**",
        ],
    }
    save_yaml(target / RESOLVED_CONFIG_PATH, resolved)
    return resolved


__all__ = [
    "default_brief_payload",
    "ensure_brief",
    "infer_adapter_id",
    "infer_app_type",
    "infer_bootstrap_mode",
    "infer_blocked_paths",
    "infer_critical_paths",
    "infer_deploy_target",
    "infer_kernel_profile",
    "infer_owned_paths",
    "infer_one_liner",
    "infer_package_manager",
    "infer_project_name",
    "kernel_version",
    "load_yaml",
    "migrate_legacy_config",
    "normalize_brief_payload",
    "resolve_project_config",
    "save_yaml",
    "split_success_criteria",
    "validate_brief_payload",
    "validate_config_file",
]
