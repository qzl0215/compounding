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
  pending_dev_release_id: null,
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
      pending_dev_release_id: payload.pending_dev_release_id ?? null,
      updated_at: payload.updated_at ?? null,
      releases: Array.isArray(payload.releases)
        ? payload.releases.map((release) => normalizeReleaseRecord(release))
        : []
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
  const pendingDevRelease =
    releases.find((release) => release.release_id === registry.pending_dev_release_id) ||
    releases.find((release) => release.channel === "dev" && release.acceptance_status === "pending") ||
    null;
  return {
    runtime_root: getReleaseRuntimeRoot(),
    active_release_id: registry.active_release_id,
    active_release: activeRelease,
    pending_dev_release: pendingDevRelease,
    dev_preview_url: getChannelBaseUrl("dev"),
    production_url: getChannelBaseUrl("prod"),
    releases,
    local_runtime: getLocalRuntimeStatus(),
    local_preview: getLocalRuntimeStatus("dev"),
  };
}

export function getLocalRuntimeStatus(profile: "prod" | "dev" = "prod"): LocalRuntimeStatus {
  const scriptPath = path.join(
    getWorkspaceRoot(),
    "scripts",
    "local-runtime",
    profile === "dev" ? "status-preview.ts" : "status-prod.ts"
  );
  if (!fs.existsSync(scriptPath)) {
    return {
      status: "stopped",
      running: false,
      port: profile === "dev" ? 3011 : 3010,
      pid: null,
      runtime_release_id: null,
      current_release_id: null,
      drift: false,
      reason: profile === "dev" ? "dev 预览运行时脚本尚未安装。" : "本地运行时脚本尚未安装。",
      log_path: path.join(getReleaseRuntimeRoot(), "shared", profile === "dev" ? "local-dev.log" : "local-prod.log"),
      state_path: path.join(getReleaseRuntimeRoot(), "shared", profile === "dev" ? "local-dev.json" : "local-prod.json"),
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
      port: profile === "dev" ? 3011 : 3010,
      pid: null,
      runtime_release_id: null,
      current_release_id: null,
      drift: false,
      reason: error instanceof Error ? error.message : "无法读取本地运行时状态。",
      log_path: path.join(getReleaseRuntimeRoot(), "shared", profile === "dev" ? "local-dev.log" : "local-prod.log"),
      state_path: path.join(getReleaseRuntimeRoot(), "shared", profile === "dev" ? "local-dev.json" : "local-prod.json"),
    };
  }
}

export function runCreateDevPreview(ref = "HEAD"): ReleaseActionResult {
  return runCreateDevPreviewWithTasks(ref, null, []);
}

export function runCreateDevPreviewWithTasks(ref = "HEAD", primaryTaskId: string | null, linkedTaskIds: string[] = []): ReleaseActionResult {
  const args = ["--ref", ref, "--channel", "dev"];
  if (primaryTaskId) {
    args.push("--primary-task", primaryTaskId);
  }
  if (linkedTaskIds.length > 0) {
    args.push("--linked-tasks", linkedTaskIds.join(","));
  }
  const prepare = runReleaseScript("prepare-release.ts", args);
  return {
    ok: prepare.ok,
    message: prepare.message,
    release: prepare.release,
    registry: readReleaseRegistry()
  };
}

export function runAcceptDevRelease(releaseId: string): ReleaseActionResult {
  const promoted = runReleaseScript("accept-dev-release.ts", ["--release", releaseId]);
  return {
    ok: promoted.ok,
    message: promoted.message,
    release: promoted.release,
    registry: readReleaseRegistry()
  };
}

export function runRejectDevRelease(releaseId: string): ReleaseActionResult {
  const rejected = runReleaseScript("reject-dev-release.ts", ["--release", releaseId]);
  return {
    ok: rejected.ok,
    message: rejected.message,
    release: rejected.release,
    registry: readReleaseRegistry()
  };
}

export function runDeployRelease(ref = "main"): ReleaseActionResult {
  const prepare = runReleaseScript("prepare-release.ts", ["--ref", ref, "--channel", "prod"]);
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

function getChannelBaseUrl(channel: "dev" | "prod") {
  if (channel === "dev") {
    const host = process.env.AI_OS_LOCAL_PREVIEW_HOST || "127.0.0.1";
    const port = process.env.AI_OS_LOCAL_PREVIEW_PORT || "3011";
    return `http://${host}:${port}`;
  }
  const host = process.env.AI_OS_LOCAL_PROD_HOST || process.env.AI_OS_LOCAL_HOST || "127.0.0.1";
  const port = process.env.AI_OS_LOCAL_PROD_PORT || process.env.AI_OS_LOCAL_PORT || "3010";
  return `http://${host}:${port}`;
}

function normalizeReleaseRecord(release: ReleaseRecord): ReleaseRecord {
  return {
    ...release,
    primary_task_id: release.primary_task_id ?? null,
    linked_task_ids: Array.isArray(release.linked_task_ids) ? release.linked_task_ids : [],
    delivery_summary: release.delivery_summary ?? null,
    delivery_benefit: release.delivery_benefit ?? null,
    delivery_risks: release.delivery_risks ?? null,
    channel: release.channel === "dev" ? "dev" : "prod",
    acceptance_status: release.acceptance_status || (release.status === "failed" ? "rejected" : release.channel === "dev" ? "pending" : "accepted"),
    preview_url: release.preview_url || (release.channel === "dev" ? getChannelBaseUrl("dev") : null),
    promoted_to_main_at: release.promoted_to_main_at ?? null,
    promoted_from_dev_release_id: release.promoted_from_dev_release_id ?? null,
  };
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
