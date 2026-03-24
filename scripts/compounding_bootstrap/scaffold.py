from __future__ import annotations

from pathlib import Path

from .bootstrap import bootstrap


def scaffold(config_path: Path, target: Path) -> dict:
    return bootstrap(config_path, target)


__all__ = ["scaffold"]
