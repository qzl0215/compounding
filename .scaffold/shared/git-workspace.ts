import { execFileSync } from "node:child_process";
import path from "node:path";

function runGit(args: string[], cwd = process.cwd()) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

export function resolveRepositoryRoot(cwd = process.cwd()) {
  try {
    return runGit(["rev-parse", "--path-format=absolute", "--show-toplevel"], cwd);
  } catch {
    return path.resolve(cwd);
  }
}

export function resolveGitCommonRoot(cwd = process.cwd()) {
  try {
    const commonDir = runGit(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd);
    return path.dirname(commonDir);
  } catch {
    return resolveRepositoryRoot(cwd);
  }
}

export function resolveSharedRuntimeRoot(cwd = process.cwd()) {
  return process.env.AI_OS_RELEASE_ROOT || path.resolve(resolveGitCommonRoot(cwd), "..", ".compounding-runtime");
}
