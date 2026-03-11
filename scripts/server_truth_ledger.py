#!/usr/bin/env python3
from pathlib import Path
import json
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "output" / "pipeline" / "state" / "server_truth_ledger" / "latest.json"
TARGET.parent.mkdir(parents=True, exist_ok=True)
TARGET.write_text(json.dumps({
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "note": "Server truth ledger is enabled in advanced mode."
}, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
print(TARGET)
