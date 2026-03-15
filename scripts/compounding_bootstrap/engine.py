from __future__ import annotations

import argparse
import json
from pathlib import Path

from .audit import audit
from .config_resolution import load_yaml, migrate_legacy_config, validate_config_file
from .defaults import AGENTS_PATH
from .proposal_engine import apply_proposal, baseline_commit_suggestion, create_proposal
from .scaffold import scaffold


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="AI-native bootstrap engine")
    subparsers = parser.add_subparsers(dest="command", required=True)

    scaffold_parser = subparsers.add_parser("scaffold")
    scaffold_parser.add_argument("--config", required=True)
    scaffold_parser.add_argument("--target", required=True)

    audit_parser = subparsers.add_parser("audit")
    audit_parser.add_argument("--config", required=True)
    audit_parser.add_argument("--target", required=True)

    propose_parser = subparsers.add_parser("propose")
    propose_parser.add_argument("--config", required=True)
    propose_parser.add_argument("--target", required=True)
    propose_parser.add_argument("--prompt-file", required=True)

    apply_parser = subparsers.add_parser("apply-proposal")
    apply_parser.add_argument("--proposal", required=True)
    apply_parser.add_argument("--target", required=True)

    args = parser.parse_args(argv)
    target = Path(getattr(args, "target", ".")).resolve()

    if args.command == "scaffold":
        scaffold(Path(args.config), target)
        print(json.dumps({"ok": True, "target": str(target)}, ensure_ascii=False))
        return 0
    if args.command == "audit":
        result = audit(Path(args.config), target)
        print(
            json.dumps(
                {
                    "passed": result.passed,
                    "errors": result.errors,
                    "warnings": result.warnings,
                    "checked_files": result.checked_files,
                    "missing_assets": result.missing_assets,
                    "conflicting_rules": result.conflicting_rules,
                    "hardcoded_legacy_terms": result.hardcoded_legacy_terms,
                },
                indent=2,
                ensure_ascii=False,
            )
        )
        return 0 if result.passed else 1
    if args.command == "propose":
        proposal_id = create_proposal(Path(args.config), target, Path(args.prompt_file))
        print(json.dumps({"proposal_id": proposal_id}, ensure_ascii=False))
        return 0
    if args.command == "apply-proposal":
        apply_proposal(target, args.proposal)
        print(json.dumps({"ok": True, "proposal_id": args.proposal}, ensure_ascii=False))
        return 0
    return 1


__all__ = [
    "AGENTS_PATH",
    "apply_proposal",
    "audit",
    "baseline_commit_suggestion",
    "create_proposal",
    "load_yaml",
    "main",
    "migrate_legacy_config",
    "scaffold",
    "validate_config_file",
]
