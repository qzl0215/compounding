import fs from "node:fs/promises";
import path from "node:path";
import type { Proposal, ProposalBundle, ReviewSummary } from "./types";
import { getWorkspaceRoot } from "./workspace";

const proposalsRoot = path.join(getWorkspaceRoot(), "output", "proposals");

function buildReviewSummary(proposal: Proposal, diff: string): ReviewSummary {
  const risky = proposal.validation_summary.dirty_worktree || !proposal.validation_summary.git_ready;
  const riskLevel = risky || proposal.affected_files.length > 3 ? "high" : proposal.affected_files.length > 1 ? "medium" : "low";
  const diffExcerpt = diff
    .split("\n")
    .filter((line) => line.startsWith("@@") || line.startsWith("+") || line.startsWith("-"))
    .slice(0, 10)
    .join("\n");

  return {
    id: proposal.id,
    goal: proposal.prompt,
    impact_summary: `涉及 ${proposal.affected_files.length} 个文件，包含 ${proposal.validation_summary.target_block_count} 个托管 block。`,
    risk_level: riskLevel,
    touched_files: proposal.affected_files,
    acceptance_note: proposal.apply_commit_message,
    requires_manual_review: true,
    diff_excerpt: diffExcerpt || proposal.diff_summary
  };
}

export async function listProposalBundles(): Promise<ProposalBundle[]> {
  try {
    const entries = await fs.readdir(proposalsRoot, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort().reverse();
    return Promise.all(folders.map(readProposalBundle));
  } catch {
    return [];
  }
}

export async function readProposalBundle(id: string): Promise<ProposalBundle> {
  const base = path.join(proposalsRoot, id);
  const proposal = JSON.parse(await fs.readFile(path.join(base, "metadata.json"), "utf8")) as Proposal;
  const diff = await fs.readFile(path.join(base, "diff.patch"), "utf8");
  const filesDir = path.join(base, "files");
  const candidateFiles: Record<string, string> = {};

  async function visit(relativeDir = ""): Promise<void> {
    const absolute = path.join(filesDir, relativeDir);
    const entries = await fs.readdir(absolute, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(relativeDir, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else {
        candidateFiles[entryPath.replaceAll(path.sep, "/")] = await fs.readFile(path.join(filesDir, entryPath), "utf8");
      }
    }
  }

  try {
    await visit();
  } catch {
    return {
      proposal,
      diff,
      candidateFiles,
      reviewSummary: buildReviewSummary(proposal, diff)
    };
  }

  return {
    proposal,
    diff,
    candidateFiles,
    reviewSummary: buildReviewSummary(proposal, diff)
  };
}
