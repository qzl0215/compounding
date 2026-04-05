#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path.cwd()
OUTPUT = ROOT / "output" / "agent_session" / "latest_pre_mutation_check.json"
IGNORED_STATUS_PREFIXES = (
    "output/",
    "agent-coordination/",
    ".compounding-runtime/",
)

def run_git(args: list[str]) -> tuple[bool, str]:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return True, result.stdout.strip()
    except subprocess.CalledProcessError as error:
        return False, (error.stdout or error.stderr or "").strip()

def git_head() -> str:
    ok, output = run_git(["rev-parse", "HEAD"])
    return output if ok and output else "UNCOMMITTED"

def git_branch() -> str:
    ok, output = run_git(["branch", "--show-current"])
    return output if ok and output else "DETACHED_OR_NONE"

def has_remote() -> bool:
    ok, output = run_git(["remote"])
    return ok and bool(output.strip())

def has_upstream() -> bool:
    ok, _ = run_git(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
    return ok

def worktree_clean() -> bool:
    ok, output = run_git(["status", "--porcelain"])
    if not ok:
        return False
    entries = [line.strip() for line in output.splitlines() if line.strip()]
    relevant = []
    for entry in entries:
        path = entry[3:].strip() if len(entry) > 3 else entry
        if any(path.startswith(prefix) for prefix in IGNORED_STATUS_PREFIXES):
            continue
        relevant.append(entry)
    return not relevant

def sync_status() -> str:
    if not has_remote():
        return "no_remote"
    if not has_upstream():
        return "no_upstream"
    fetch_ok, _ = run_git(["fetch", "--prune"])
    if not fetch_ok:
        return "fetch_failed"
    ok, output = run_git(["rev-list", "--left-right", "--count", "HEAD...@{u}"])
    if not ok or not output:
        return "sync_unknown"
    ahead_text, behind_text = output.split()
    ahead = int(ahead_text)
    behind = int(behind_text)
    if ahead > 0 and behind > 0:
        return "diverged"
    if behind > 0:
        return "behind"
    if ahead > 0:
        return "ahead"
    return "clean"

def next_action(clean: bool, status: str) -> str:
    if not clean:
        return "Commit, stash, or discard local changes before mutation."
    if status in {"behind", "diverged"}:
        return "Run `git pull --rebase` before mutation."
    if status == "fetch_failed":
        return "Resolve remote connectivity before mutation."
    if status in {"no_remote", "no_upstream"}:
        return "Mutation is allowed locally, but branch sync cannot be verified."
    return "Mutation is allowed."

def main() -> int:
    clean = worktree_clean()
    status = sync_status()
    payload = {
        "branch": git_branch(),
        "head_sha": git_head(),
        "has_remote": has_remote(),
        "has_upstream": has_upstream(),
        "worktree_clean": clean,
        "sync_status": status,
        "next_action": next_action(clean, status),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
