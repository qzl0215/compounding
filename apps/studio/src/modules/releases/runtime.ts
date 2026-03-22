import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";
import type { LocalRuntimeStatus } from "./types";

export function getReleaseRuntimeRoot() {
  return process.env.AI_OS_RELEASE_ROOT || path.resolve(getWorkspaceRoot(), "..", ".compounding-runtime");
}

export function getChannelBaseUrl(channel: "dev" | "prod") {
  if (channel === "dev") {
    const host = process.env.AI_OS_LOCAL_PREVIEW_HOST || "127.0.0.1";
    const port = process.env.AI_OS_LOCAL_PREVIEW_PORT || "3011";
    return `http://${host}:${port}`;
  }
  const host = process.env.AI_OS_LOCAL_PROD_HOST || process.env.AI_OS_LOCAL_HOST || "127.0.0.1";
  const port = process.env.AI_OS_LOCAL_PROD_PORT || process.env.AI_OS_LOCAL_PORT || "3010";
  return `http://${host}:${port}`;
}

export function getLocalRuntimeStatus(profile: "prod" | "dev" = "prod"): LocalRuntimeStatus {
  const scriptPath = path.join(
    getWorkspaceRoot(),
    "scripts",
    "local-runtime",
    profile === "dev" ? "status-preview.ts" : "status-prod.ts"
  );
  if (!fs.existsSync(scriptPath)) {
    return createRuntimeFallback(profile, profile === "dev" ? "dev 预览运行时脚本尚未安装。" : "本地运行时脚本尚未安装。");
  }

  try {
    const output = execFileSync("node", ["--experimental-strip-types", scriptPath], {
      cwd: getWorkspaceRoot(),
      encoding: "utf8"
    }).trim();
    const payload = JSON.parse(output) as { ok?: boolean } & LocalRuntimeStatus;
    return {
      status: payload.status,
      running: payload.running,
      port: payload.port,
      pid: payload.pid,
      runtime_release_id: payload.runtime_release_id,
      current_release_id: payload.current_release_id,
      drift: payload.drift,
      reason: payload.reason,
      log_path: payload.log_path,
      state_path: payload.state_path,
    };
  } catch (error) {
    return createRuntimeFallback(profile, error instanceof Error ? error.message : "无法读取本地运行时状态。", "port_error");
  }
}

function createRuntimeFallback(
  profile: "prod" | "dev",
  reason: string,
  status: LocalRuntimeStatus["status"] = "stopped"
): LocalRuntimeStatus {
  const suffix = profile === "dev" ? "local-dev" : "local-prod";
  return {
    status,
    running: false,
    port: profile === "dev" ? 3011 : 3010,
    pid: null,
    runtime_release_id: null,
    current_release_id: null,
    drift: false,
    reason,
    log_path: path.join(getReleaseRuntimeRoot(), "shared", `${suffix}.log`),
    state_path: path.join(getReleaseRuntimeRoot(), "shared", `${suffix}.json`),
  };
}
