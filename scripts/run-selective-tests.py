#!/usr/bin/env python3
"""
Selective test runner based on changed files.

Given a list of changed files (or auto-detect via git), runs only the
relevant Python test files instead of the full suite.

Usage:
    python3 scripts/run-selective-tests.py                    # auto-detect from git
    python3 scripts/run-selective-tests.py --files file1 file2  # explicit files
    python3 scripts/run-selective-tests.py --all             # run all tests
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS_DIR = ROOT / "tests"

# Source path pattern -> Test file(s) mapping
# Order matters: more specific patterns first
CHANGE_TEST_MAP = [
    # Governance and task validation (in scripts/ai)
    ("scripts/ai/validate-governance-guards", ["test_ai_governance_guards_cli.py"]),
    ("scripts/ai/validate-task-git-link", ["test_coord_cli.py"]),
    ("scripts/ai/validate-knowledge-assets", ["test_ai_assets_cli.py"]),
    ("scripts/ai/lib/governance-guard-contract", ["test_ai_governance_guards_cli.py"]),
    ("scripts/ai/lib/knowledge-asset", ["test_ai_assets_cli.py"]),
    ("scripts/ai/lib/task-contract", ["test_coord_cli.py"]),
    ("scripts/ai/lib/task-identity", ["test_coord_cli.py"]),

    # Summary/feature/context scripts (in scripts/ai)
    ("scripts/ai/summary-harness", ["test_ai_summary_harness.py"]),
    ("scripts/ai/find-summary", ["test_ai_summary_harness.py"]),
    ("scripts/ai/tree-summary", ["test_ai_summary_harness.py"]),
    ("scripts/ai/diff-summary", ["test_ai_summary_harness.py"]),
    ("scripts/ai/read-summary", ["test_ai_summary_harness.py"]),
    ("scripts/ai/preflight-summary", ["test_ai_summary_harness.py"]),
    ("scripts/ai/review-summary", ["test_ai_summary_harness.py"]),
    ("scripts/ai/validate-static-summary", ["test_ai_summary_harness.py"]),
    ("scripts/ai/validate-build-summary", ["test_ai_summary_harness.py"]),
    ("scripts/ai/preview-summary", ["test_ai_summary_harness.py"]),
    ("scripts/ai/prod-summary", ["test_ai_summary_harness.py"]),
    ("scripts/ai/feature-context", ["test_ai_feature_context.py"]),
    ("scripts/ai/context-retro", ["test_ai_context_retro.py"]),
    ("scripts/ai/retro-candidates", ["test_ai_learning_candidates.py"]),
    ("scripts/ai/learning-candidates", ["test_ai_learning_candidates.py"]),
    ("scripts/ai/lib/summary-profiles", ["test_ai_summary_harness.py"]),
    ("scripts/ai/lib/command-gain", ["test_ai_summary_harness.py"]),

    # Bootstrap scripts
    ("scripts/compounding_bootstrap/", ["test_bootstrap_golden_matrix.py", "test_bootstrap_proposals_cli.py", "test_bootstrap_scaffold_cli.py"]),

    # Harness scripts
    ("scripts/harness/", ["test_harness_cli.py", "test_harness_parity_cli.py"]),

    # Release scripts
    ("scripts/release/", ["test_release_registry_state.py"]),

    # Coord scripts
    ("scripts/coord/", ["test_coord_cli.py"]),

    # Studio (JS tests run separately)
    ("apps/studio/", []),  # Skip - runs via pnpm filter

    # Shared libraries - shared across multiple test domains
    ("shared/", ["test_coord_cli.py", "test_ai_assets_cli.py", "test_derived_asset_contract.py"]),

    # Kernel configs
    ("kernel/", []),  # Config only, tested via other paths

    # Bootstrap configs and templates
    ("bootstrap/", ["test_bootstrap_golden_matrix.py", "test_bootstrap_proposals_cli.py", "test_bootstrap_scaffold_cli.py"]),

    # Default for any unmatched scripts/ai/** files
    ("scripts/ai/", ["test_ai_summary_harness.py", "test_ai_assets_cli.py"]),
]


def get_changed_files_from_git():
    """Get list of changed files from git (staged + unstaged)."""
    files = set()

    # Unstaged changes
    result = subprocess.run(
        ["git", "diff", "--name-only"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        for f in result.stdout.strip().split("\n"):
            if f:
                files.add(f)

    # Staged changes
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        for f in result.stdout.strip().split("\n"):
            if f:
                files.add(f)

    # Recent commits (for workflow mode)
    result = subprocess.run(
        ["git", "log", "-1", "--name-only", "--pretty="],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        for f in result.stdout.strip().split("\n"):
            if f:
                files.add(f)

    return files


def find_matching_tests(changed_files: set[str]) -> set[str]:
    """Find test files that match the changed source files."""
    matched_tests = set()

    for changed_file in changed_files:
        for pattern, tests in CHANGE_TEST_MAP:
            if pattern in changed_file:
                for test in tests:
                    matched_tests.add(test)
                break  # Stop at first match

    return matched_tests


def run_tests(test_files: set[str], verbose: bool = False) -> int:
    """Run the specified test files."""
    if not test_files:
        print("No relevant tests found for changed files.")
        return 0

    print(f"Running {len(test_files)} test file(s): {', '.join(sorted(test_files))}")

    for test_file in sorted(test_files):
        test_path = TESTS_DIR / test_file
        if not test_path.exists():
            print(f"Warning: {test_file} not found, skipping")
            continue

        # Build args - use discover mode for each specific test file
        args = ["python3", "-m", "unittest", "discover"]
        if verbose:
            args.append("-v")
        args.extend(["-s", str(TESTS_DIR), "-p", test_file])
        print(f"  Running: {' '.join(args)}")
        result = subprocess.run(args, cwd=ROOT)
        if result.returncode != 0:
            return result.returncode

    return 0


def run_all_tests(verbose: bool = False) -> int:
    """Run all Python tests."""
    print("Running all tests...")
    args = ["python3", "-m", "unittest", "discover"]
    if verbose:
        args.append("-v")
    args.extend(["-s", str(TESTS_DIR), "-p", "test_*.py"])
    result = subprocess.run(args, cwd=ROOT)
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description="Run selective tests based on changed files")
    parser.add_argument("--files", nargs="*", help="Explicit list of changed files")
    parser.add_argument("--all", action="store_true", help="Run all tests (ignore selective)")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    args = parser.parse_args()

    if args.all:
        return run_all_tests(args.verbose)

    if args.files:
        changed_files = set(args.files)
    else:
        changed_files = get_changed_files_from_git()

    if not changed_files:
        print("No changed files detected. Running all tests.")
        return run_all_tests(args.verbose)

    print(f"Changed files: {', '.join(sorted(changed_files))}")

    matched_tests = find_matching_tests(changed_files)

    if not matched_tests:
        print("No test files matched. Running all tests.")
        return run_all_tests(args.verbose)

    return run_tests(matched_tests, args.verbose)


if __name__ == "__main__":
    sys.exit(main())
