#!/usr/bin/env python3
"""
Migrate files to .scaffold/ and .scaffold-internal/ structure.
Run from Compounding project root.
"""
import shutil
import os
from pathlib import Path

ROOT = Path("/Users/apple/Documents/GitHub/Compounding")

def move_dir(src, dst):
    """Move directory, creating parent dirs if needed."""
    src_p = ROOT / src
    dst_p = ROOT / dst
    if not src_p.exists():
        print(f"SKIP: {src} does not exist")
        return
    dst_p.parent.mkdir(parents=True, exist_ok=True)
    if dst_p.exists():
        print(f"REMOVE existing: {dst}")
        shutil.rmtree(dst_p)
    print(f"MOVE {src} -> {dst}")
    shutil.move(str(src_p), str(dst_p))

def copy_dir(src, dst):
    """Copy directory, creating parent dirs if needed."""
    src_p = ROOT / src
    dst_p = ROOT / dst
    if not src_p.exists():
        print(f"SKIP: {src} does not exist")
        return
    dst_p.parent.mkdir(parents=True, exist_ok=True)
    if dst_p.exists():
        print(f"REMOVE existing: {dst}")
        shutil.rmtree(dst_p)
    print(f"COPY {src} -> {dst}")
    shutil.copytree(str(src_p), str(dst_p))

def main():
    # Create scaffold directories
    (ROOT / ".scaffold").mkdir(exist_ok=True)
    (ROOT / ".scaffold-internal").mkdir(exist_ok=True)

    # === .scaffold/ structure ===

    # 1. scripts/ subdirs -> .scaffold/scripts/
    # Move (not copy) so original scripts/ dir shrinks
    for subdir in ["ai", "coord", "local-runtime", "release", "harness"]:
        move_dir(f"scripts/{subdir}", f".scaffold/scripts/{subdir}")

    # 2. Copy compounding_bootstrap to .scaffold/scripts/ (keep original for bootstrap entry)
    copy_dir("scripts/compounding_bootstrap", ".scaffold/scripts/compounding_bootstrap")

    # 3. shared/ -> .scaffold/shared/
    move_dir("shared", ".scaffold/shared")

    # 4. resources/skills/ -> .scaffold/resources/skills/
    move_dir("resources/skills", ".scaffold/resources/skills")

    # 5. apps/studio/ -> .scaffold/studio/
    move_dir("apps/studio", ".scaffold/studio")

    # 6. kernel/, schemas/, templates/ -> .scaffold/ (copy, keep originals)
    copy_dir("kernel", ".scaffold/kernel")
    copy_dir("schemas", ".scaffold/schemas")
    copy_dir("templates", ".scaffold/templates")

    # === .scaffold-internal/ structure ===

    # 7. memory/ -> .scaffold-internal/memory/
    move_dir("memory", ".scaffold-internal/memory")

    # 8. tasks/ -> .scaffold-internal/tasks/
    move_dir("tasks", ".scaffold-internal/tasks")

    print("\n=== Migration complete ===")
    print("\n.scaffold/ structure:")
    for p in sorted((ROOT / ".scaffold").rglob("*")):
        if p.is_dir():
            continue
        rel = p.relative_to(ROOT)
        print(f"  {rel}")

    print("\n.scaffold-internal/ structure:")
    for p in sorted((ROOT / ".scaffold-internal").rglob("*")):
        if p.is_dir():
            continue
        rel = p.relative_to(ROOT)
        print(f"  {rel}")

    print("\nRemaining scripts/ directory:")
    scripts_root = ROOT / "scripts"
    if scripts_root.exists():
        for p in sorted(scripts_root.rglob("*")):
            if p.is_dir():
                continue
            rel = p.relative_to(ROOT)
            print(f"  {rel}")

if __name__ == "__main__":
    main()
