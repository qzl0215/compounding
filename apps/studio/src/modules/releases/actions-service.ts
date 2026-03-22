import { execFileSync } from "node:child_process";
import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";
import type { ReleaseActionResult } from "./types";
import { readReleaseRegistry } from "./registry";

export function runCreateDevPreview(ref = "HEAD"): ReleaseActionResult {
  return runCreateDevPreviewWithTasks(ref, null, []);
}

export function runCreateDevPreviewWithTasks(
  ref = "HEAD",
  primaryTaskId: string | null,
  linkedTaskIds: string[] = []
): ReleaseActionResult {
  const args = ["--ref", ref, "--channel", "dev"];
  if (primaryTaskId) {
    args.push("--primary-task", primaryTaskId);
  }
  if (linkedTaskIds.length > 0) {
    args.push("--linked-tasks", linkedTaskIds.join(","));
  }
  return finalizeAction(runReleaseScript("prepare-release.ts", args));
}

export function runAcceptDevRelease(releaseId: string): ReleaseActionResult {
  return finalizeAction(runReleaseScript("accept-dev-release.ts", ["--release", releaseId]));
}

export function runRejectDevRelease(releaseId: string): ReleaseActionResult {
  return finalizeAction(runReleaseScript("reject-dev-release.ts", ["--release", releaseId]));
}

export function runDeployRelease(ref = "main"): ReleaseActionResult {
  const prepare = runReleaseScript("prepare-release.ts", ["--ref", ref, "--channel", "prod"]);
  const prepared = prepare.release;
  if (!prepare.ok || !prepared || prepared.build_result !== "passed" || prepared.smoke_result !== "passed") {
    return finalizeAction({
      ok: false,
      message: prepare.message || "新版本准备失败，未执行切换。",
      release: prepared,
    });
  }
  return finalizeAction(runReleaseScript("switch-release.ts", ["--release", prepared.release_id]));
}

export function runRollbackRelease(releaseId: string): ReleaseActionResult {
  return finalizeAction(runReleaseScript("rollback-release.ts", ["--release", releaseId]));
}

function runReleaseScript(scriptName: string, args: string[]): ReleaseActionResult {
  const scriptPath = path.join(getWorkspaceRoot(), "scripts", "release", scriptName);
  try {
    const raw = execFileSync("node", ["--experimental-strip-types", scriptPath, ...args], {
      cwd: getWorkspaceRoot(),
      encoding: "utf8"
    }).trim();
    return JSON.parse(raw) as ReleaseActionResult;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Release command failed."
    };
  }
}

function finalizeAction(result: ReleaseActionResult): ReleaseActionResult {
  return {
    ok: result.ok,
    message: result.message,
    release: result.release,
    registry: readReleaseRegistry()
  };
}
