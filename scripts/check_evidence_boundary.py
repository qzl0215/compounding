#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ["本地离线证据", "服务器真实证据", "当前结论适用边界"]

for path in (ROOT / "docs").glob("*.md"):
    text = path.read_text(encoding="utf8")
    if not all(item in text for item in REQUIRED):
        print(f"missing evidence boundary: {path.relative_to(ROOT)}")
        sys.exit(1)

print("evidence boundary check passed")
