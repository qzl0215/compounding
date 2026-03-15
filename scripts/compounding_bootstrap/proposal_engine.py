from __future__ import annotations

import difflib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .defaults import AGENTS_PATH, BASELINE_COMMIT_MESSAGE, CANONICAL_BLOCK_ID, OUTPUT_PROPOSALS_DIR
from .managed_blocks import extract_managed_block, split_frontmatter, update_existing_document_block
from .proposal_generation import generate_proposal_block
from .proposal_support import checksum, git, git_has_staged_changes, git_head, git_is_dirty, safe_name, summarize_prompt


def baseline_commit_suggestion() -> str:
    return f'Create baseline commit with "{BASELINE_COMMIT_MESSAGE}".'


def create_proposal(config_path: Path, target: Path, prompt_file: Path) -> str:
    prompt = prompt_file.read_text(encoding="utf8").strip()
    proposal_id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    proposal_root = target / OUTPUT_PROPOSALS_DIR / proposal_id
    proposal_root.mkdir(parents=True, exist_ok=True)

    target_files = select_target_files(prompt)
    target_blocks: list[dict[str, Any]] = []
    diff_chunks: list[str] = []
    affected_files: list[str] = []
    generation_providers: list[str] = []
    generation_models: list[str] = []
    fallback_reasons: list[str] = []

    for relative_path in target_files:
        path = target / relative_path
        if not path.exists():
            continue
        meta, body = split_frontmatter(path.read_text(encoding="utf8"))
        before = extract_managed_block(body, CANONICAL_BLOCK_ID)
        generation = generate_proposal_block(
            relative_path=relative_path,
            current_block=before,
            prompt=prompt,
            fallback=synthesize_block,
        )
        after = generation.content
        if before.strip() == after.strip():
            continue
        before_path = proposal_root / "before" / safe_name(relative_path)
        after_path = proposal_root / "after" / safe_name(relative_path)
        before_path.parent.mkdir(parents=True, exist_ok=True)
        after_path.parent.mkdir(parents=True, exist_ok=True)
        before_path.write_text(before, encoding="utf8")
        after_path.write_text(after, encoding="utf8")
        target_blocks.append(
            {
                "file_path": relative_path,
                "block_id": CANONICAL_BLOCK_ID,
                "before_checksum": checksum(before),
                "before_path": before_path.relative_to(proposal_root).as_posix(),
                "after_path": after_path.relative_to(proposal_root).as_posix(),
                "provider": generation.provider,
                "model": generation.model,
            }
        )
        affected_files.append(relative_path)
        generation_providers.append(generation.provider)
        generation_models.append(generation.model)
        if generation.fallback_reason:
            fallback_reasons.append(f"{relative_path}: {generation.fallback_reason}")
        diff_chunks.extend(
            difflib.unified_diff(
                before.splitlines(),
                after.splitlines(),
                fromfile=f"{relative_path}:{CANONICAL_BLOCK_ID}:before",
                tofile=f"{relative_path}:{CANONICAL_BLOCK_ID}:after",
                lineterm="",
            )
        )

    metadata = {
        "id": proposal_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "prompt": prompt,
        "affected_files": affected_files,
        "diff_summary": summarize_prompt(prompt),
        "risk_notes": [
            "This proposal only updates declared managed blocks.",
            "Apply will fail if worktree is dirty or HEAD has changed.",
        ],
        "status": "pending",
        "apply_commit_message": f"chore: apply proposal {proposal_id}",
        "action_type": "canonical_update",
        "target_blocks": target_blocks,
        "validation_summary": {
            "managed_block_only": True,
            "target_count": len(target_blocks),
            "generation_providers": sorted(set(generation_providers)),
            "generation_models": sorted(set(generation_models)),
            "fallback_reasons": fallback_reasons,
        },
        "base_revision": git_head(target),
        "generation_provider": generation_providers[0] if generation_providers else "deterministic-fallback",
        "generation_model": generation_models[0] if generation_models else "heuristic-rules",
    }

    (proposal_root / "metadata.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    (proposal_root / "diff.patch").write_text("\n".join(diff_chunks) + ("\n" if diff_chunks else ""), encoding="utf8")
    return proposal_id


def apply_proposal(target: Path, proposal_id: str) -> None:
    proposal_root = target / OUTPUT_PROPOSALS_DIR / proposal_id
    metadata_path = proposal_root / "metadata.json"
    if not metadata_path.exists():
        raise ValueError(f"Unknown proposal: {proposal_id}")
    metadata = json.loads(metadata_path.read_text(encoding="utf8"))
    if metadata["status"] != "pending":
        raise ValueError("Proposal is not pending.")
    head = git_head(target)
    if not head:
        raise ValueError("Baseline commit required before applying proposals.")
    if git_has_staged_changes(target):
        raise ValueError("Cannot apply proposal while staged changes exist.")
    if git_is_dirty(target):
        raise ValueError("Cannot apply proposal because worktree is dirty.")
    if metadata.get("base_revision") and metadata["base_revision"] != head:
        raise ValueError("Proposal base revision no longer matches current HEAD.")

    for block in metadata["target_blocks"]:
        path = target / block["file_path"]
        if not path.exists():
            raise ValueError(f"Target file missing: {block['file_path']}")
        _, body = split_frontmatter(path.read_text(encoding="utf8"))
        current = extract_managed_block(body, block["block_id"])
        if checksum(current) != block["before_checksum"]:
            raise ValueError(f"Target block drifted: {block['file_path']}")
        after_text = (proposal_root / block["after_path"]).read_text(encoding="utf8")
        update_existing_document_block(path, after_text, block["block_id"])

    git(["add", "."], target)
    git(["commit", "-m", metadata["apply_commit_message"]], target)
    metadata["status"] = "applied"
    metadata["applied_at"] = datetime.now(timezone.utc).isoformat()
    metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf8")


def select_target_files(prompt: str) -> list[str]:
    lowered = prompt.lower()
    targets = [AGENTS_PATH]
    if any(token in lowered for token in ["rule", "review", "规范", "规则", "边界"]):
        targets.append("docs/PROJECT_RULES.md")
    if any(token in lowered for token in ["workflow", "preflight", "汇报", "review"]):
        targets.append("docs/DEV_WORKFLOW.md")
    return list(dict.fromkeys(targets))


def synthesize_block(before: str, relative_path: str, prompt: str) -> str:
    lines = before.splitlines()
    if relative_path == AGENTS_PATH:
        lines = update_agents_lines(lines, prompt)
    elif relative_path == "docs/PROJECT_RULES.md":
        lines = update_project_rules_lines(lines, prompt)
    elif relative_path == "docs/DEV_WORKFLOW.md":
        lines = update_dev_workflow_lines(lines, prompt)
    return "\n".join(lines).strip() + "\n"


def update_agents_lines(lines: list[str], prompt: str) -> list[str]:
    updated = list(lines)
    if "成功定义" in prompt or "success" in prompt.lower():
        updated = [
            "### refined success definition"
            if line.startswith("- 成功定义：")
            else line
            for line in updated
        ]
        updated = [
            "- 成功定义：任何新线程先读 AGENTS.md 即可进入统一执行协议，并在最小上下文内完成可信、可回滚、可审计的改动。"
            if line == "### refined success definition"
            else line
            for line in updated
        ]
    if "review" in prompt.lower() or "审核" in prompt:
        marker = "- 任何结构性改动都必须绑定任务、更新相关记忆，并通过 PR 合并。"
        addition = "- 关键结构改动必须先 review 再写入，禁止跳过任务和证据边界直接落盘。"
        if addition not in updated:
            try:
                index = updated.index(marker)
                updated.insert(index + 1, addition)
            except ValueError:
                updated.append(addition)
    return updated


def update_project_rules_lines(lines: list[str], prompt: str) -> list[str]:
    updated = list(lines)
    if "review" in prompt.lower() or "审核" in prompt:
        addition = "- 关键结构改动必须带 review 说明、证据边界和删除计划。"
        if addition not in updated:
            try:
                index = updated.index("## Change Contract")
                updated.insert(index + 5, addition)
            except ValueError:
                updated.append(addition)
    return updated


def update_dev_workflow_lines(lines: list[str], prompt: str) -> list[str]:
    updated = list(lines)
    if "review" in prompt.lower() or "审核" in prompt:
        addition = "- 关键结构改动默认先 review，再执行最终写入。"
        if addition not in updated:
            try:
                index = updated.index("## PR Rule")
                updated.insert(index + 1, "")
                updated.insert(index + 2, addition)
            except ValueError:
                updated.append(addition)
    return updated

