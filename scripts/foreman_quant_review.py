#!/usr/bin/env python3
from pathlib import Path
import json
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
target = ROOT / "output" / "pipeline" / "state" / "foreman_quant_review" / "latest.json"
target.parent.mkdir(parents=True, exist_ok=True)
docs_count = len(list((ROOT / "docs").glob("*.md")))
proposal_count = len([path for path in (ROOT / "output" / "proposals").glob("*") if path.is_dir()])
target.write_text(json.dumps({
    "generated_at": datetime.now(timezone.utc).isoformat(),
    "docs_count": docs_count,
    "proposal_count": proposal_count,
    "next_focus": "Keep the core light and keep the front-end simple."
}, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
print(target)
