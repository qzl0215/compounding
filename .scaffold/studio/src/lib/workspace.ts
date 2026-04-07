import fs from "node:fs";
import path from "node:path";

const WORKSPACE_MARKERS = [
  "AGENTS.md",
  path.join("memory", "project", "operating-blueprint.md"),
  "pnpm-workspace.yaml",
];

export function resolveWorkspaceRoot(startDir: string) {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (WORKSPACE_MARKERS.every((marker) => fs.existsSync(path.join(currentDir, marker)))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return path.resolve(startDir, "../..");
    }

    currentDir = parentDir;
  }
}

export function getWorkspaceRoot() {
  if (process.env.AI_OS_WORKSPACE_ROOT) {
    return process.env.AI_OS_WORKSPACE_ROOT;
  }

  return resolveWorkspaceRoot(process.cwd());
}
