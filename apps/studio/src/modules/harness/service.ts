import { execFileSync } from "node:child_process";
import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";
import type { HarnessLiveSnapshot } from "./types";

export const harnessServiceRuntime = {
  runHarnessStatusCommand(workspaceRoot = getWorkspaceRoot()) {
    const scriptPath = path.join(workspaceRoot, "scripts", "harness", "status.ts");
    return execFileSync("node", ["--experimental-strip-types", scriptPath], {
      cwd: workspaceRoot,
      encoding: "utf8",
    }).trim();
  },
};

export function getHarnessLiveSnapshot(): HarnessLiveSnapshot {
  const output = harnessServiceRuntime.runHarnessStatusCommand();
  return JSON.parse(output) as HarnessLiveSnapshot;
}
