#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
PLACEHOLDER = """## 证据边界

- 本地离线证据：
- 服务器真实证据：
- 当前结论适用边界："""
manifest = json.loads((ROOT / "bootstrap" / "templates" / "document_manifest.json").read_text(encoding="utf8"))

for relative_path in manifest["core_docs"]:
    if relative_path == "docs/README.md":
        continue
    path = ROOT / relative_path
    text = path.read_text(encoding="utf8")
    if PLACEHOLDER in text:
        print(f"redundant evidence boundary placeholder: {path.relative_to(ROOT)}")
        sys.exit(1)

print("evidence boundary placeholder check passed")
