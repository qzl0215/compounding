import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { GitBaselineSuggestion, GitHistoryEntry, PreMutationCheck } from "./types";
import { getWorkspaceRoot } from "@/lib/workspace";

function runGit(args: string[]) {
  try {
    return execFileSync("git", args, {
      cwd: getWorkspaceRoot(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}

export function getGitHistory(limit = 20): GitHistoryEntry[] {
  const output = runGit(["log", `--max-count=${limit}`, "--pretty=format:%H|%ad|%s", "--date=short"]);
  if (!output) {
    return [];
  }

  return output.split("\n").map((line) => {
    const [hash, date, subject] = line.split("|");
    return { hash, date, subject };
  });
}

export function getGitStatus() {
  return runGit(["status", "--short"]);
}

export function getGitHead() {
  return runGit(["rev-parse", "HEAD"]);
}

export function getGitBaselineSuggestion(): GitBaselineSuggestion {
  const head = getGitHead();
  if (head) {
    return {
      needsBaselineCommit: false,
      message: "Git baseline is already established.",
      commands: []
    };
  }

  return {
    needsBaselineCommit: true,
    message: "Baseline commit is required before proposals can be applied safely.",
    commands: ['git add .', 'git commit -m "chore: baseline bootstrap initialization"']
  };
}

export function getLatestPreMutationCheck(): PreMutationCheck | null {
  try {
    const filePath = path.join(getWorkspaceRoot(), "output", "agent_session", "latest_pre_mutation_check.json");
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as PreMutationCheck;
  } catch {
    return null;
  }
}
