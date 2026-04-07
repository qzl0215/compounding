from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def slugify(value: str) -> str:
    return "-".join(part for part in "".join(ch.lower() if ch.isalnum() else "-" for ch in value).split("-") if part)


def scan_repo(target: Path) -> dict[str, Any]:
    package_path = target / "package.json"
    package_payload: dict[str, Any] = {}
    if package_path.exists():
        try:
            package_payload = json.loads(package_path.read_text(encoding="utf8"))
        except json.JSONDecodeError:
            package_payload = {}

    extensions = {".md": "Markdown", ".py": "Python", ".ts": "TypeScript", ".tsx": "TypeScript"}
    languages: set[str] = set()
    largest_files: list[tuple[int, str]] = []
    scan_roots = [target / "bootstrap", target / "apps/studio", target / "scripts/compounding_bootstrap"]
    for root in scan_roots:
        if not root.exists():
            continue
        for file_path in root.rglob("*"):
            if not file_path.is_file():
                continue
            if any(part in {"node_modules", ".git", "__pycache__"} for part in file_path.parts):
                continue
            label = extensions.get(file_path.suffix)
            if label:
                languages.add(label)
            try:
                line_count = len(file_path.read_text(encoding="utf8", errors="ignore").splitlines())
            except OSError:
                continue
            largest_files.append((line_count, file_path.relative_to(target).as_posix()))
    largest_files.sort(reverse=True)

    studio_root = target / "apps/studio/src/modules"
    studio_modules = sorted(child.name for child in studio_root.iterdir() if child.is_dir()) if studio_root.exists() else []

    bootstrap_root = target / "scripts/compounding_bootstrap"
    bootstrap_modules = (
        sorted(
            child.stem
            for child in bootstrap_root.iterdir()
            if child.is_file() and child.suffix == ".py" and child.stem != "__init__"
        )
        if bootstrap_root.exists()
        else []
    )

    return {
        "languages": sorted(languages) or ["Markdown"],
        "package_manager": "pnpm" if (target / "pnpm-lock.yaml").exists() else "unknown",
        "build_command": package_payload.get("scripts", {}).get("build", "pnpm build"),
        "test_command": package_payload.get("scripts", {}).get("test", "pnpm test"),
        "studio_modules": studio_modules,
        "bootstrap_modules": bootstrap_modules,
        "largest_files": largest_files[:10],
    }
