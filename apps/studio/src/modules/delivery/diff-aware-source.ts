import { execFileSync } from "node:child_process";
import { getWorkspaceRoot } from "../../lib/workspace";
import { parseGitChangedFiles } from "../../../../../shared/git-changed-files";
import type { DiffSnapshot, DiffSnapshotSourceMode, DiffStats } from "./diff-snapshot";

const WORKTREE_STATUS_REF = "git status --short";
const MAIN_BRANCH = "main";

function git(args: string[]) {
  try {
    return execFileSync("git", args, { cwd: getWorkspaceRoot(), encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trimEnd();
  } catch {
    return "";
  }
}

function currentBranch() {
  const value = git(["branch", "--show-current"]);
  return value || "";
}

function toNumber(value: string | undefined) {
  const parsed = Number.parseInt(value || "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function summarizeNumStat(output: string): DiffStats {
  if (!output.trim()) {
    return { files: 0, insertions: 0, deletions: 0 };
  }

  const rows = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let files = 0;
  let insertions = 0;
  let deletions = 0;

  for (const row of rows) {
    const [insert, deleteCount] = row.split(/\s+/);
    if (insert === "-" || deleteCount === "-") {
      continue;
    }
    files += 1;
    insertions += toNumber(insert);
    deletions += toNumber(deleteCount);
  }

  return { files, insertions, deletions };
}

function getDiffStatsFromFiles(files: string[]): DiffStats {
  if (files.length === 0) {
    return { files: 0, insertions: 0, deletions: 0 };
  }

  const unstaged = summarizeNumStat(git(["diff", "--numstat"]));
  const staged = summarizeNumStat(git(["diff", "--numstat", "--cached"]));
  return {
    files: Math.max(files.length, unstaged.files + staged.files),
    insertions: unstaged.insertions + staged.insertions,
    deletions: unstaged.deletions + staged.deletions,
  };
}

function getDiffStatsFromRange(range: string): DiffStats {
  try {
    return summarizeNumStat(git(["diff", "--numstat", range]));
  } catch {
    return { files: 0, insertions: 0, deletions: 0 };
  }
}

function parseRangeChangedFiles(range: string) {
  return parseGitChangedFiles(git(["diff", "--name-only", range]), { mode: "name_only" });
}

function emptySnapshot(): DiffSnapshot {
  return {
    source_mode: "none",
    range_ref: null,
    changed_files: [],
    stats: { files: 0, insertions: 0, deletions: 0 },
  };
}

function buildRangeSnapshot(sourceMode: Exclude<DiffSnapshotSourceMode, "worktree" | "none">, rangeRef: string | null): DiffSnapshot {
  if (!rangeRef) {
    return emptySnapshot();
  }

  const changedFiles = parseRangeChangedFiles(rangeRef);
  if (changedFiles.length === 0) {
    return emptySnapshot();
  }

  return {
    source_mode: sourceMode,
    range_ref: rangeRef,
    changed_files: changedFiles,
    stats: getDiffStatsFromRange(rangeRef),
  };
}

export function readDiffSnapshot(): DiffSnapshot {
  const status = git(["status", "--short"]);
  if (status) {
    const changedFiles = parseGitChangedFiles(status, { mode: "status" });
    if (changedFiles.length === 0) {
      return emptySnapshot();
    }
    return {
      source_mode: "worktree",
      range_ref: WORKTREE_STATUS_REF,
      changed_files: changedFiles,
      stats: getDiffStatsFromFiles(changedFiles),
    };
  }

  const branch = currentBranch();
  if (branch && branch !== MAIN_BRANCH) {
    const mergeBase = git(["merge-base", "HEAD", MAIN_BRANCH]);
    const range = mergeBase ? `${mergeBase}..HEAD` : null;
    return buildRangeSnapshot("branch_vs_main", range);
  }

  return buildRangeSnapshot("recent_commit", "HEAD^..HEAD");
}
