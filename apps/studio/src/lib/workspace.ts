import path from "node:path";

export function getWorkspaceRoot() {
  if (process.env.AI_OS_WORKSPACE_ROOT) {
    return process.env.AI_OS_WORKSPACE_ROOT;
  }

  return path.resolve(process.cwd(), "../..");
}
