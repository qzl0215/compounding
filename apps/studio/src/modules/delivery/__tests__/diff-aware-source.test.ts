import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readDiffSnapshot } from "../diff-aware-source";

function git(cwd: string, args: string[]) {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function writeFile(root: string, relativePath: string, content: string) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

describe("readDiffSnapshot", () => {
  const previousWorkspaceRoot = process.env.AI_OS_WORKSPACE_ROOT;
  let repoRoot = "";

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "diff-aware-source-"));
    process.env.AI_OS_WORKSPACE_ROOT = repoRoot;
    writeFile(repoRoot, "apps/studio/src/app/page.tsx", "export const pageTitle = 'baseline';\n");
    git(repoRoot, ["init"]);
    git(repoRoot, ["config", "user.name", "Test User"]);
    git(repoRoot, ["config", "user.email", "test@example.com"]);
    git(repoRoot, ["add", "."]);
    git(repoRoot, ["commit", "-m", "baseline"]);
    git(repoRoot, ["branch", "-M", "main"]);
  });

  afterEach(() => {
    if (previousWorkspaceRoot === undefined) {
      delete process.env.AI_OS_WORKSPACE_ROOT;
    } else {
      process.env.AI_OS_WORKSPACE_ROOT = previousWorkspaceRoot;
    }
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  it("reports worktree mode for dirty tracked changes", () => {
    writeFile(repoRoot, "apps/studio/src/app/page.tsx", "export const pageTitle = 'dirty';\n");

    const snapshot = readDiffSnapshot();

    expect(snapshot.source_mode).toBe("worktree");
    expect(snapshot.range_ref).toBe("git status --short");
    expect(snapshot.changed_files).toEqual(["apps/studio/src/app/page.tsx"]);
    expect(snapshot.stats.files).toBe(1);
  });

  it("reports branch_vs_main for a clean feature branch", () => {
    git(repoRoot, ["checkout", "-b", "feature/diff-snapshot"]);
    writeFile(repoRoot, "apps/studio/src/app/page.tsx", "export const pageTitle = 'feature';\n");
    git(repoRoot, ["add", "apps/studio/src/app/page.tsx"]);
    git(repoRoot, ["commit", "-m", "feature change"]);

    const snapshot = readDiffSnapshot();

    expect(snapshot.source_mode).toBe("branch_vs_main");
    expect(snapshot.range_ref).toMatch(/^[0-9a-f]{40}\.\.HEAD$/);
    expect(snapshot.changed_files).toEqual(["apps/studio/src/app/page.tsx"]);
    expect(snapshot.stats.files).toBe(1);
  });

  it("reports recent_commit for a clean main branch", () => {
    writeFile(repoRoot, "apps/studio/src/app/page.tsx", "export const pageTitle = 'main';\n");
    git(repoRoot, ["add", "apps/studio/src/app/page.tsx"]);
    git(repoRoot, ["commit", "-m", "main change"]);

    const snapshot = readDiffSnapshot();

    expect(snapshot.source_mode).toBe("recent_commit");
    expect(snapshot.range_ref).toBe("HEAD^..HEAD");
    expect(snapshot.changed_files).toEqual(["apps/studio/src/app/page.tsx"]);
    expect(snapshot.stats.files).toBe(1);
  });

  it("reports none when there is no observable diff", () => {
    const snapshot = readDiffSnapshot();

    expect(snapshot.source_mode).toBe("none");
    expect(snapshot.range_ref).toBeNull();
    expect(snapshot.changed_files).toEqual([]);
    expect(snapshot.stats).toEqual({ files: 0, insertions: 0, deletions: 0 });
  });
});
