import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";
import type {
  LocalRuntimeStatus,
  ManagementAccessState,
  ReleaseActionResult,
  ReleaseDashboard,
  ReleaseRecord,
  ReleaseRegistry
} from "./types";

const EMPTY_REGISTRY: ReleaseRegistry = {
  active_release_id: null,
  updated_at: null,
  releases: []
};

type HeaderBag = Headers | { get(name: string): string | null } | Record<string, string | undefined>;

export function getReleaseRuntimeRoot() {
  return process.env.AI_OS_RELEASE_ROOT || path.resolve(getWorkspaceRoot(), "..", ".compounding-runtime");
}

export function getManagementAccessState(headersLike: HeaderBag): ManagementAccessState {
  const host = normalizeHost(readHeader(headersLike, "host"));
  const forwarded = splitHeaderValues(readHeader(headersLike, "x-forwarded-for"));
  const realIp = splitHeaderValues(readHeader(headersLike, "x-real-ip"));
  const candidates = [host, ...forwarded, ...realIp].filter(Boolean);

  if (candidates.some((value) => isLocalOrPrivate(value))) {
    return { allowed: true, reason: "ok" };
  }

  return {
    allowed: false,
    reason: "发布管理页和发布接口仅允许本机或内网访问。"
  };
}

export function readReleaseRegistry(): ReleaseRegistry {
  const registryPath = path.join(getReleaseRuntimeRoot(), "registry.json");
  if (!fs.existsSync(registryPath)) {
    return EMPTY_REGISTRY;
  }
  try {
    const payload = JSON.parse(fs.readFileSync(registryPath, "utf8")) as ReleaseRegistry;
    return {
      active_release_id: payload.active_release_id ?? null,
      updated_at: payload.updated_at ?? null,
      releases: Array.isArray(payload.releases) ? payload.releases : []
    };
  } catch {
    return EMPTY_REGISTRY;
  }
}

export function getReleaseDashboard(): ReleaseDashboard {
  const registry = readReleaseRegistry();
  const releases = [...registry.releases].sort((left, right) =>
    (right.cutover_at || right.created_at).localeCompare(left.cutover_at || left.created_at)
  );
  const activeRelease = releases.find((release) => release.release_id === registry.active_release_id) || null;
  return {
    runtime_root: getReleaseRuntimeRoot(),
    active_release_id: registry.active_release_id,
    active_release: activeRelease,
    releases,
    local_runtime: getLocalRuntimeStatus(),
  };
}

export function getLocalRuntimeStatus(): LocalRuntimeStatus {
  const scriptPath = path.join(getWorkspaceRoot(), "scripts", "local-runtime", "status-prod.ts");
  if (!fs.existsSync(scriptPath)) {
    return {
      status: "stopped",
      running: false,
      port: 3000,
      pid: null,
      runtime_release_id: null,
      current_release_id: null,
      drift: false,
      reason: "本地运行时脚本尚未安装。",
      log_path: path.join(getReleaseRuntimeRoot(), "shared", "local-prod.log"),
      state_path: path.join(getReleaseRuntimeRoot(), "shared", "local-prod.json"),
    };
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
    return {
      status: "port_error",
      running: false,
      port: 3000,
      pid: null,
      runtime_release_id: null,
      current_release_id: null,
      drift: false,
      reason: error instanceof Error ? error.message : "无法读取本地运行时状态。",
      log_path: path.join(getReleaseRuntimeRoot(), "shared", "local-prod.log"),
      state_path: path.join(getReleaseRuntimeRoot(), "shared", "local-prod.json"),
    };
  }
}

export function runDeployRelease(ref = "main"): ReleaseActionResult {
  const prepare = runReleaseScript("prepare-release.ts", ["--ref", ref]);
  const prepared = prepare.release;
  if (!prepare.ok || !prepared || prepared.build_result !== "passed" || prepared.smoke_result !== "passed") {
    return {
      ok: false,
      message: prepare.message || "新版本准备失败，未执行切换。",
      release: prepared,
      registry: readReleaseRegistry()
    };
  }

  const switched = runReleaseScript("switch-release.ts", ["--release", prepared.release_id]);
  return {
    ok: switched.ok,
    message: switched.message,
    release: switched.release,
    registry: readReleaseRegistry()
  };
}

export function runRollbackRelease(releaseId: string): ReleaseActionResult {
  const rolledBack = runReleaseScript("rollback-release.ts", ["--release", releaseId]);
  return {
    ok: rolledBack.ok,
    message: rolledBack.message,
    release: rolledBack.release,
    registry: readReleaseRegistry()
  };
}

function runReleaseScript(scriptName: string, args: string[]): ReleaseActionResult {
  const scriptPath = path.join(getWorkspaceRoot(), "scripts", "release", scriptName);
  try {
    const raw = execFileSync("node", ["--experimental-strip-types", scriptPath, ...args], {
      cwd: getWorkspaceRoot(),
      encoding: "utf8"
    }).trim();
    const payload = JSON.parse(raw) as ReleaseActionResult;
    return payload;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Release command failed."
    };
  }
}

function readHeader(headersLike: HeaderBag, name: string) {
  if ("get" in headersLike && typeof headersLike.get === "function") {
    return headersLike.get(name);
  }
  const headersObject = headersLike as Record<string, string | undefined>;
  return headersObject[name] ?? headersObject[name.toLowerCase()];
}

function splitHeaderValues(value: string | null | undefined) {
  return (value || "")
    .split(",")
    .map((item) => normalizeHost(item))
    .filter(Boolean);
}

function normalizeHost(value: string | null | undefined) {
  if (!value) {
    return "";
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("[")) {
    const closing = trimmed.indexOf("]");
    return closing === -1 ? trimmed : trimmed.slice(1, closing);
  }
  if (!trimmed.includes("::") && /:\d+$/.test(trimmed)) {
    return trimmed.replace(/:\d+$/, "");
  }
  const colonCount = (trimmed.match(/:/g) || []).length;
  if (colonCount === 1 && trimmed.includes(".")) {
    return trimmed.split(":")[0];
  }
  return trimmed;
}

function isLocalOrPrivate(value: string) {
  if (!value) {
    return false;
  }
  if (value === "localhost" || value === "::1" || value === "127.0.0.1") {
    return true;
  }
  if (/^127\./.test(value) || /^10\./.test(value) || /^192\.168\./.test(value)) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) {
    return true;
  }
  if (/^(fc|fd)[0-9a-f]{0,2}:/i.test(value)) {
    return true;
  }
  return false;
}
