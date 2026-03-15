from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

IGNORED_WORKTREE_PREFIXES = ("output/proposals/", "output/manual-prompts/")


def summarize_prompt(prompt: str) -> str:
    return prompt[:160]


def checksum(text: str) -> str:
    return hashlib.sha256(text.encode("utf8")).hexdigest()


def safe_name(relative_path: str) -> str:
    return relative_path.replace("/", "__")


def git_head(target: Path) -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=target, text=True).strip()
    except subprocess.CalledProcessError:
        return ""


def git_has_staged_changes(target: Path) -> bool:
    try:
        output = subprocess.check_output(["git", "diff", "--cached", "--name-only"], cwd=target, text=True).strip()
    except subprocess.CalledProcessError:
        return False
    paths = [line.strip() for line in output.splitlines() if line.strip()]
    return any(not path.startswith(IGNORED_WORKTREE_PREFIXES) for path in paths)


def git_is_dirty(target: Path) -> bool:
    try:
        output = subprocess.check_output(["git", "status", "--porcelain"], cwd=target, text=True).strip()
    except subprocess.CalledProcessError:
        return False
    if not output:
        return False
    for line in output.splitlines():
        candidate = line[3:] if len(line) > 3 else line
        if candidate.startswith(IGNORED_WORKTREE_PREFIXES):
            continue
        return True
    return False


def git(args: list[str], target: Path) -> None:
    subprocess.run(["git", *args], cwd=target, check=True)
