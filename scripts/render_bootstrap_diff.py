#!/usr/bin/env python3
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from scripts.compounding_bootstrap.engine import render_bootstrap_diff


def main() -> int:
    parser = argparse.ArgumentParser(description="Render a unified diff between two files.")
    parser.add_argument("--before", required=True)
    parser.add_argument("--after", required=True)
    args = parser.parse_args()
    print(render_bootstrap_diff(Path(args.before), Path(args.after)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
