import { execFileSync } from "node:child_process";
import { getWorkspaceRoot } from "../../lib/workspace";

export type DiffStats = {
  files: number;
  insertions: number;
  deletions: number;
};

function git(args: string[]) {
  try {
    return execFileSync("git", args, { cwd: getWorkspaceRoot(), encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function currentBranch() {
  const value = git(["branch", "--show-current"]);
  return value || "";
}

function dedupe(items: string[]) {
  return [...new Set(items.filter(Boolean))];
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

export function readDiffSnapshot() {
  const status = git(["status", "--short"]);
  if (status) {
    const changedFiles = dedupe(
      status
        .split("\n")
        .map((line) => {
          const match = line.match(/^.. (.+)$/);
          if (!match) return null;
          const value = match[1].trim();
          return value.includes(" -> ") ? value.split(" -> ").at(-1)?.trim() ?? null : value;
        })
        .filter((value): value is string => Boolean(value))
    );
    return {
      changedFiles,
      stats: getDiffStatsFromFiles(changedFiles),
    };
  }

  const branch = currentBranch();
  const range = branch && branch !== "main" ? `${git(["merge-base", "HEAD", "main"])}..HEAD` : "HEAD^..HEAD";
  const changedFiles = dedupe(
    git(["diff", "--name-only", range])
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  );
  return {
    changedFiles,
    stats: getDiffStatsFromRange(range),
  };
}
