import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { resolveSharedRuntimeRoot } from "./git-workspace.ts";
import { buildProjectJudgementContract, type ProjectJudgementContract } from "./project-judgement.ts";
import { findEffectivePendingDevRelease, reconcileReleaseRegistry, type MinimalReleaseRecord } from "./release-registry.ts";
import { parseTaskContract, parseTaskMachineFacts } from "./task-contract.ts";
import {
  deriveCompatTaskMachine,
  deriveTaskDeliveryStatusFromStateId,
  deriveTaskStatusFromStateId,
  normalizeTaskMachineState,
} from "./task-state-machine.ts";

export type ProjectJudgementCountFacts = {
  total: number;
  planning: number;
  ready: number;
  doing: number;
  blocked: number;
  acceptance: number;
  released: number;
};

export type ProjectJudgementReleaseFacts = {
  pendingAcceptance: string | null;
  runtimeAlert: string | null;
  activeReleaseId: string | null;
  runtimeRunning: boolean;
};

export type ProjectJudgementLiveFacts = {
  counts: ProjectJudgementCountFacts;
  release: ProjectJudgementReleaseFacts;
};

export type ProjectJudgementTaskLike = {
  stateId: string;
  deliveryStatus: string;
};

export type ProjectJudgementRuntimeLike = {
  reason: string;
  status: string;
  runtimeReleaseId: string | null;
};

type JudgementReleaseRecord = MinimalReleaseRecord & {
  release_id: string;
  primary_task_id?: string | null;
  linked_task_ids?: string[];
  status?: string | null;
};

type JudgementRuntimeStatus = {
  status: string;
  running: boolean;
  runtime_release_id: string | null;
  current_release_id: string | null;
  reason: string;
};

type JudgementTaskSnapshot = {
  id: string;
  deliveryStatus: ReturnType<typeof deriveTaskDeliveryStatusFromStateId>;
  versionLabel: string | null;
  stateId: string;
};

const EMPTY_COUNTS: ProjectJudgementCountFacts = {
  total: 0,
  planning: 0,
  ready: 0,
  doing: 0,
  blocked: 0,
  acceptance: 0,
  released: 0,
};

const EMPTY_RELEASE: ProjectJudgementReleaseFacts = {
  pendingAcceptance: null,
  runtimeAlert: null,
  activeReleaseId: null,
  runtimeRunning: false,
};

export function buildLiveProjectJudgementContract(
  root = process.cwd(),
  overrides: Partial<ProjectJudgementLiveFacts> = {},
): ProjectJudgementContract {
  const docs = readProjectJudgementSourceDocs(root);
  const liveFacts = hasCompleteLiveFacts(overrides) ? mergeLiveFacts(overrides) : mergeLiveFacts(collectProjectJudgementLiveFacts(root), overrides);
  return buildProjectJudgementContract({
    ...docs,
    counts: liveFacts.counts,
    release: liveFacts.release,
  });
}

export function collectProjectJudgementLiveFacts(root = process.cwd()): ProjectJudgementLiveFacts {
  const releases = readJudgementReleases(root);
  const tasks = readJudgementTasks(root, releases.releases);
  const prod = readRuntimeStatus(root, "prod");
  const dev = readRuntimeStatus(root, "dev");
  return {
    counts: summarizeProjectJudgementCounts(tasks),
    release: buildProjectJudgementReleaseFacts({
      pendingReleaseId: releases.pending_dev_release_id,
      acceptanceVersionLabel: tasks.find((task) => task.deliveryStatus === "pending_acceptance")?.versionLabel || null,
      prodRuntime: {
        reason: prod.reason,
        status: prod.status,
        runtimeReleaseId: prod.runtime_release_id,
      },
      devRuntime: {
        reason: dev.reason,
        status: dev.status,
        runtimeReleaseId: dev.runtime_release_id,
      },
      activeReleaseId: releases.active_release_id,
    }),
  };
}

export function summarizeProjectJudgementCounts(tasks: readonly ProjectJudgementTaskLike[]): ProjectJudgementCountFacts {
  return {
    total: tasks.length,
    planning: tasks.filter((task) => task.stateId === "planning").length,
    ready: tasks.filter((task) => task.stateId === "ready").length,
    doing: tasks.filter((task) => ["executing", "review_pending", "reviewing", "release_preparing"].includes(task.stateId)).length,
    blocked: tasks.filter((task) => task.deliveryStatus === "blocked").length,
    acceptance: tasks.filter((task) => task.deliveryStatus === "pending_acceptance").length,
    released: tasks.filter((task) => task.deliveryStatus === "released" || task.deliveryStatus === "rolled_back").length,
  };
}

export function buildProjectJudgementReleaseFacts(input: {
  pendingReleaseId: string | null;
  acceptanceVersionLabel: string | null;
  prodRuntime: ProjectJudgementRuntimeLike;
  devRuntime: ProjectJudgementRuntimeLike;
  activeReleaseId: string | null;
}): ProjectJudgementReleaseFacts {
  return {
    pendingAcceptance: summarizePendingAcceptance(input.pendingReleaseId, input.acceptanceVersionLabel),
    runtimeAlert: summarizeRuntimeAlert(
      input.prodRuntime.reason,
      input.prodRuntime.status,
      input.devRuntime.reason,
      input.devRuntime.status,
      Boolean(input.pendingReleaseId),
    ),
    activeReleaseId: input.prodRuntime.runtimeReleaseId || input.activeReleaseId,
    runtimeRunning: input.prodRuntime.status === "running",
  };
}

function readProjectJudgementSourceDocs(root: string) {
  return {
    currentStateContent: readText(root, "memory/project/current-state.md"),
    roadmapContent: readText(root, "memory/project/roadmap.md"),
    blueprintContent: readText(root, "memory/project/operating-blueprint.md"),
  };
}

function hasCompleteLiveFacts(overrides: Partial<ProjectJudgementLiveFacts>) {
  const counts = overrides.counts;
  const release = overrides.release;
  return Boolean(
    counts &&
      typeof counts.total === "number" &&
      typeof counts.planning === "number" &&
      typeof counts.ready === "number" &&
      typeof counts.doing === "number" &&
      typeof counts.blocked === "number" &&
      typeof counts.acceptance === "number" &&
      typeof counts.released === "number" &&
      release &&
      Object.prototype.hasOwnProperty.call(release, "pendingAcceptance") &&
      Object.prototype.hasOwnProperty.call(release, "runtimeAlert") &&
      Object.prototype.hasOwnProperty.call(release, "activeReleaseId") &&
      typeof release.runtimeRunning === "boolean",
  );
}

function mergeLiveFacts(...factsList: Partial<ProjectJudgementLiveFacts>[]): ProjectJudgementLiveFacts {
  return factsList.reduce<ProjectJudgementLiveFacts>(
    (current, facts) => ({
      counts: {
        ...current.counts,
        ...(facts.counts || {}),
      },
      release: {
        ...current.release,
        ...(facts.release || {}),
      },
    }),
    {
      counts: { ...EMPTY_COUNTS },
      release: { ...EMPTY_RELEASE },
    },
  );
}

function readJudgementReleases(root: string) {
  const runtimeRoot = resolveSharedRuntimeRoot(root);
  const registryPath = path.join(runtimeRoot, "shared", "registry.json");
  const empty = {
    active_release_id: null as string | null,
    pending_dev_release_id: null as string | null,
    releases: [] as JudgementReleaseRecord[],
  };
  if (!fs.existsSync(registryPath)) {
    return empty;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(registryPath, "utf8")) as {
      active_release_id?: string | null;
      pending_dev_release_id?: string | null;
      releases?: JudgementReleaseRecord[];
    };
    const reconciled = reconcileReleaseRegistry({
      active_release_id: raw.active_release_id ?? null,
      pending_dev_release_id: raw.pending_dev_release_id ?? null,
      releases: Array.isArray(raw.releases) ? raw.releases : [],
    }).registry;
    return {
      active_release_id: raw.active_release_id ?? null,
      pending_dev_release_id: reconciled.pending_dev_release_id ?? null,
      releases: Array.isArray(reconciled.releases) ? reconciled.releases : [],
    };
  } catch {
    return empty;
  }
}

function readJudgementTasks(root: string, releases: JudgementReleaseRecord[]): JudgementTaskSnapshot[] {
  const taskDir = path.join(root, "tasks", "queue");
  if (!fs.existsSync(taskDir)) {
    return [];
  }
  return fs
    .readdirSync(taskDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => buildJudgementTaskSnapshot(root, path.posix.join("tasks/queue", name), releases))
    .filter((task): task is JudgementTaskSnapshot => Boolean(task));
}

function buildJudgementTaskSnapshot(root: string, taskPath: string, releases: JudgementReleaseRecord[]) {
  const content = readText(root, taskPath);
  if (!content) {
    return null;
  }
  const parsed = parseTaskContract(taskPath, content);
  const parsedMachine = parseTaskMachineFacts(content);
  const companion = readCompanion(root, parsed.id);
  const fallbackMachine =
    !normalizeString(companion?.contract_hash) &&
    deriveCompatTaskMachine(
      {
        task_status: parsed.status,
        current_mode: parsedMachine.currentMode,
        delivery_track: parsedMachine.deliveryTrack,
      },
      root,
    );
  const machine = companion?.machine ? normalizeTaskMachineState(companion.machine, root) : fallbackMachine || deriveCompatTaskMachine({}, root);
  const taskStatus = deriveTaskStatusFromStateId(machine.state_id);
  const explicitReleaseRefs = uniqueStrings([
    parsedMachine.primaryRelease,
    ...parsedMachine.linkedReleases,
    ...readCompanionReleaseIds(companion),
  ]);
  const associated = releases
    .filter((release) => matchesTaskRelease(parsed.id, explicitReleaseRefs, release))
    .sort((left, right) => sortStamp(right).localeCompare(sortStamp(left)));
  const pendingDev = findEffectivePendingDevRelease(associated);
  const prodReleases = associated.filter((release) => release.channel === "prod" && release.acceptance_status === "accepted");
  const activeProd = prodReleases.find((release) => release.status === "active") || null;
  const latestProd = prodReleases[0] || null;
  const branch = normalizeString(parsedMachine.branch) || normalizeString(companion?.branch_name);
  const recentCommit =
    normalizeString(parsedMachine.recentCommit) ||
    normalizeString(companion?.lifecycle?.handoff?.git_head) ||
    normalizeString(companion?.lifecycle?.release_handoff?.git_head);
  const canonical = deriveTaskDeliveryStatusFromStateId(machine.state_id);
  const deliveryStatus = resolveDeliveryStatus(taskStatus, canonical, parsed.id, pendingDev, activeProd, latestProd, root, branch, recentCommit);
  return {
    id: parsed.id,
    stateId: machine.state_id,
    deliveryStatus,
    versionLabel: inferVersionLabel(pendingDev, activeProd, latestProd, explicitReleaseRefs),
  };
}

function readCompanion(root: string, taskId: string) {
  const companionPath = path.join(root, "agent-coordination", "tasks", `${taskId}.json`);
  if (!fs.existsSync(companionPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(companionPath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readCompanionReleaseIds(companion: Record<string, unknown> | null) {
  const notes = Array.isArray((companion?.artifacts as { release_notes?: { release_id?: string | null }[] } | undefined)?.release_notes)
    ? ((companion?.artifacts as { release_notes?: { release_id?: string | null }[] }).release_notes || [])
    : [];
  const lifecycleReleaseId = normalizeString(
    (companion?.lifecycle as { release_handoff?: { release_id?: string | null } } | undefined)?.release_handoff?.release_id,
  );
  return uniqueStrings([
    lifecycleReleaseId,
    ...notes.map((note) => normalizeString(note?.release_id)),
  ]);
}

function matchesTaskRelease(taskId: string, explicitReleaseRefs: string[], release: JudgementReleaseRecord) {
  if (release.primary_task_id === taskId) {
    return true;
  }
  if (Array.isArray(release.linked_task_ids) && release.linked_task_ids.includes(taskId)) {
    return true;
  }
  return explicitReleaseRefs.includes(release.release_id);
}

function resolveDeliveryStatus(
  taskStatus: string,
  canonical: ReturnType<typeof deriveTaskDeliveryStatusFromStateId>,
  taskId: string,
  pendingDev: JudgementReleaseRecord | null,
  activeProd: JudgementReleaseRecord | null,
  latestProd: JudgementReleaseRecord | null,
  root: string,
  branch: string,
  recentCommit: string,
) {
  if (pendingDev?.primary_task_id === taskId) {
    return "pending_acceptance" as const;
  }
  if (canonical !== "not_started") {
    return canonical;
  }
  if (taskStatus === "blocked") {
    return "blocked" as const;
  }
  if (taskStatus === "doing") {
    return "in_progress" as const;
  }
  if (taskStatus === "done" && (activeProd || latestProd || isMergedIntoMain(root, branch, recentCommit))) {
    return "released" as const;
  }
  return "not_started" as const;
}

function inferVersionLabel(
  pendingDev: JudgementReleaseRecord | null,
  activeProd: JudgementReleaseRecord | null,
  latestProd: JudgementReleaseRecord | null,
  explicitReleaseRefs: string[],
) {
  return pendingDev?.release_id || activeProd?.release_id || latestProd?.release_id || explicitReleaseRefs[0] || null;
}

function isMergedIntoMain(root: string, branch: string, recentCommit: string) {
  const normalizedBranch = normalizeString(branch);
  if (normalizedBranch === "main") {
    return true;
  }
  const commit = sanitizeCommit(recentCommit);
  if (!commit) {
    return false;
  }
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", commit, "main"], {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function readRuntimeStatus(root: string, profile: "prod" | "dev"): JudgementRuntimeStatus {
  const scriptPath = path.join(root, "scripts", "local-runtime", profile === "dev" ? "status-preview.ts" : "status-prod.ts");
  if (!fs.existsSync(scriptPath)) {
    return {
      status: "stopped",
      running: false,
      runtime_release_id: null,
      current_release_id: null,
      reason: profile === "dev" ? "dev 预览未启动。" : "production 未启动。",
    };
  }
  try {
    const output = execFileSync("node", ["--experimental-strip-types", scriptPath], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const payload = JSON.parse(output) as Partial<JudgementRuntimeStatus>;
    return {
      status: normalizeString(payload.status) || "stopped",
      running: Boolean(payload.running),
      runtime_release_id: normalizeString(payload.runtime_release_id) || null,
      current_release_id: normalizeString(payload.current_release_id) || null,
      reason: normalizeString(payload.reason) || (profile === "dev" ? "dev 预览未启动。" : "production 未启动。"),
    };
  } catch (error) {
    return {
      status: "port_error",
      running: false,
      runtime_release_id: null,
      current_release_id: null,
      reason: error instanceof Error ? error.message : "无法读取运行时状态。",
    };
  }
}

function summarizePendingAcceptance(pendingReleaseId: string | null, acceptanceVersionLabel: string | null) {
  if (pendingReleaseId) return `待验收版本 ${pendingReleaseId}`;
  if (acceptanceVersionLabel) return `${acceptanceVersionLabel} 待验收`;
  return null;
}

function summarizeRuntimeAlert(
  prodReason: string,
  prodStatus: string,
  devReason: string,
  devStatus: string,
  hasPendingAcceptance: boolean,
) {
  if (prodStatus !== "running") return `production 异常：${prodReason}`;
  if (hasPendingAcceptance && devStatus !== "running") return `dev 预览异常：${devReason}`;
  return null;
}

function sortStamp(release: JudgementReleaseRecord) {
  return String(release.cutover_at || release.created_at || "");
}

function readText(root: string, relativePath: string) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function normalizeString(value: unknown) {
  return String(value || "").trim();
}

function sanitizeCommit(value: string) {
  const normalized = normalizeString(value).replace(/`/g, "");
  if (!normalized || normalized.toLowerCase() === "pending" || normalized.toLowerCase().startsWith("auto:")) {
    return "";
  }
  return normalized;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => normalizeString(value)).filter(Boolean)));
}
