from __future__ import annotations

import argparse
import json
from pathlib import Path

from .attach import attach
from .audit import audit
from .bootstrap import bootstrap
from .config_resolution import load_yaml, migrate_legacy_config, validate_config_file
from .defaults import AGENTS_PATH
from .proposal import apply_proposal as apply_kernel_proposal
from .proposal import create_proposal as create_kernel_proposal
from .proposal_engine import apply_proposal as apply_document_proposal
from .proposal_engine import baseline_commit_suggestion, create_proposal as create_document_proposal
from .scaffold import scaffold


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Compounding kernel/shell bootstrap engine")
    subparsers = parser.add_subparsers(dest="command", required=True)

    bootstrap_parser = subparsers.add_parser("bootstrap")
    bootstrap_parser.add_argument("--config", default="bootstrap/project_brief.yaml")
    bootstrap_parser.add_argument("--target", required=True)

    scaffold_parser = subparsers.add_parser("scaffold")
    scaffold_parser.add_argument("--config", default="bootstrap/project_brief.yaml")
    scaffold_parser.add_argument("--target", required=True)

    attach_parser = subparsers.add_parser("attach")
    attach_parser.add_argument("--config", default="bootstrap/project_brief.yaml")
    attach_parser.add_argument("--target", required=True)
    attach_parser.add_argument("--adoption-mode", choices=["attach", "reattach"], default="attach")

    audit_parser = subparsers.add_parser("audit")
    audit_parser.add_argument("--config", default="bootstrap/project_brief.yaml")
    audit_parser.add_argument("--target", required=True)

    proposal_parser = subparsers.add_parser("proposal")
    proposal_parser.add_argument("--config", default="bootstrap/project_brief.yaml")
    proposal_parser.add_argument("--target", required=True)
    proposal_parser.add_argument("--prompt-file")

    propose_parser = subparsers.add_parser("propose")
    propose_parser.add_argument("--config", default="bootstrap/project_brief.yaml")
    propose_parser.add_argument("--target", required=True)
    propose_parser.add_argument("--prompt-file")

    apply_parser = subparsers.add_parser("apply-proposal")
    apply_parser.add_argument("--proposal", required=True)
    apply_parser.add_argument("--target", required=True)

    args = parser.parse_args(argv)
    target = Path(getattr(args, "target", ".")).resolve()
    config = Path(getattr(args, "config", "bootstrap/project_brief.yaml"))
    config_path = config if config.is_absolute() else target / config

    if args.command in {"bootstrap", "scaffold"}:
        report = bootstrap(config_path, target)
        print(json.dumps({"ok": True, "target": str(target), "report": report}, ensure_ascii=False, indent=2))
        return 0
    if args.command == "attach":
        report = attach(config_path, target, adoption_mode=args.adoption_mode)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0
    if args.command == "audit":
        result = audit(config_path, target)
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
                ensure_ascii=False,
                indent=2,
            )
        )
        return 0 if result.passed else 1
    if args.command in {"proposal", "propose"}:
        prompt_file = getattr(args, "prompt_file", None)
        if prompt_file:
            proposal_id = create_document_proposal(config_path, target, Path(prompt_file))
            print(json.dumps({"proposal_id": proposal_id, "mode": "document"}, ensure_ascii=False, indent=2))
            return 0
        proposal_id = create_kernel_proposal(target, config_path)
        print(json.dumps({"proposal_id": proposal_id, "mode": "kernel"}, ensure_ascii=False, indent=2))
        return 0
    if args.command == "apply-proposal":
        proposal_root = target / "output" / "proposals" / args.proposal
        if (proposal_root / "proposal.yaml").exists():
            result = apply_kernel_proposal(target, args.proposal)
            print(json.dumps({"ok": True, "proposal_id": args.proposal, "mode": "kernel", "result": result}, ensure_ascii=False, indent=2))
            return 0
        apply_document_proposal(target, args.proposal)
        print(json.dumps({"ok": True, "proposal_id": args.proposal, "mode": "document"}, ensure_ascii=False))
        return 0
    return 1


__all__ = [
    "AGENTS_PATH",
    "apply_document_proposal",
    "apply_kernel_proposal",
    "attach",
    "audit",
    "baseline_commit_suggestion",
    "bootstrap",
    "create_document_proposal",
    "create_kernel_proposal",
    "load_yaml",
    "main",
    "migrate_legacy_config",
    "scaffold",
    "validate_config_file",
]
