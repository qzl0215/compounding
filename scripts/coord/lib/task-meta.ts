/**
 * Task companion JSON read/write for agent-coordination.
 */

const fs = require("node:fs");
const path = require("node:path");
const { resolveTaskRecord } = require("../../ai/lib/task-resolver.ts");
const { parseTaskContract, parseTaskMachineFacts, taskContractFingerprint } = require("../../../shared/task-contract.ts");
const { createInitialTaskMachine, deriveCompatTaskMachine } = require("../../../shared/task-state-machine.ts");
const {
  deriveBranchCleanupOverallState,
  normalizeBranchCleanupRecord,
} = require("../../../shared/branch-cleanup.ts");
const {
  buildCompatView,
  createEmptyArtifacts,
  createEmptyLifecycle,
  mergeArtifactList,
  normalizeCompanion,
  uniqueStrings,
} = require("./companion-shape.ts");

const ROOT = process.cwd();
const TASKS_DIR = path.join(ROOT, "agent-coordination", "tasks");

function ensureDir() {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

function getTaskRecord(taskLike) {
  return resolveTaskRecord(taskLike, ROOT);
}

function getTaskPath(taskLike) {
  return getTaskRecord(taskLike)?.path || null;
}

function getCompanionPath(taskLike) {
  const record = getTaskRecord(taskLike);
  if (record) {
    return path.join(TASKS_DIR, `${record.id}.json`);
  }
  const base = String(taskLike || "").replace(/^t-/, "task-").replace(/\.md$/, "");
  return path.join(TASKS_DIR, `${base}.json`);
}

function readTaskContent(taskLike) {
  const record = getTaskRecord(taskLike);
  if (!record) return null;
  const abs = path.join(ROOT, record.path);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
}

function serializeCompanion(companion) {
  return normalizeCompanion(companion);
}

function usesCanonicalTaskContract(content) {
  return String(content || "").includes("交付轨道") && !String(content || "").includes("## 当前模式");
}

function parseTaskToCompanion(taskLike, content) {
  const record = getTaskRecord(taskLike);
  if (!record) return null;

  const parsed = parseTaskContract(record.path, content);
  const parsedMachine = parseTaskMachineFacts(content);
  const branch = parsedMachine.branch;
  const currentMode = parsedMachine.currentMode;
  const modules = uniqueStrings(parsedMachine.relatedModules);
  const plannedFiles = modules.filter(
    (item) => item.includes("/") || /\.(md|ts|tsx|js|json|yaml|yml)$/.test(item) || /^\.[A-Za-z0-9._-]+$/.test(item),
  );
  if (!plannedFiles.includes(record.path)) {
    plannedFiles.unshift(record.path);
  }
  const machine = usesCanonicalTaskContract(content)
    ? createInitialTaskMachine({
        delivery_track: parsedMachine.deliveryTrack,
        source: "coord:task:create",
      })
    : deriveCompatTaskMachine({
        task_status: parsed.status,
        current_mode: currentMode,
        delivery_track: parsedMachine.deliveryTrack,
      });

  const companion = normalizeCompanion({
    schema_version: "4",
    task_id: record.shortId,
    task_path: record.path,
    contract_hash: taskContractFingerprint(parsed),
    current_mode: currentMode || undefined,
    branch_name: branch || `codex/${record.id}`,
    completion_mode: "close_full_contract",
    planned_files: plannedFiles,
    planned_modules: modules.filter((item) => !plannedFiles.includes(item)),
    locks: [],
    machine,
    lifecycle: createEmptyLifecycle(),
    artifacts: createEmptyArtifacts(),
  });
  if (!currentMode) {
    companion.current_mode = "";
  }
  return companion;
}

function normalizeTaskStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "已完成") return "done";
  if (normalized === "阻塞中") return "blocked";
  if (normalized === "进行中" || normalized === "in_progress") return "doing";
  if (normalized === "待开始") return "todo";
  return normalized || "todo";
}

function resolveTaskStatus(taskPath, content) {
  try {
    return normalizeTaskStatus(parseTaskContract(taskPath, content).status);
  } catch {
    return "todo";
  }
}

function reconcileBranchCleanupForTaskStatus(companion, taskStatus) {
  const current = normalizeBranchCleanupRecord(companion.artifacts?.branch_cleanup);
  if (!current || current.overall_state === "deleted" || taskStatus === "done") {
    return companion;
  }

  const branchCleanup = {
    ...current,
    overall_state: "canceled",
    canceled_reason: current.canceled_reason || "task_reopened",
    local: {
      ...current.local,
      state: current.local.state === "deleted" ? "deleted" : "canceled",
      last_error: current.local.state === "deleted" ? current.local.last_error : null,
      error_code: current.local.state === "deleted" ? current.local.error_code : null,
    },
    remote: {
      ...current.remote,
      state:
        current.remote.state === "deleted" || current.remote.state === "not_configured" ? current.remote.state : "canceled",
      last_error:
        current.remote.state === "deleted" || current.remote.state === "not_configured" ? current.remote.last_error : null,
      error_code:
        current.remote.state === "deleted" || current.remote.state === "not_configured" ? current.remote.error_code : null,
    },
  };

  branchCleanup.overall_state = deriveBranchCleanupOverallState(branchCleanup.local.state, branchCleanup.remote.state);
  companion.artifacts.branch_cleanup = branchCleanup;
  return companion;
}

function mergeCompanion(existing, parsed) {
  const current = normalizeCompanion(existing);
  const next = normalizeCompanion(parsed);
  const explicitCurrentMode = typeof parsed?.current_mode === "string" ? parsed.current_mode.trim() : "";
  const preferNextMachine =
    next.schema_version === "4" &&
    (current.schema_version !== "4" || !current.machine?.last_transition);
  return normalizeCompanion({
    ...current,
    schema_version: preferNextMachine ? next.schema_version : current.schema_version || next.schema_version,
    task_id: next.task_id || current.task_id,
    task_path: next.task_path || current.task_path,
    contract_hash: next.contract_hash || current.contract_hash,
    current_mode: explicitCurrentMode || (preferNextMachine ? next.current_mode : current.current_mode || next.current_mode),
    branch_name: next.branch_name || current.branch_name,
    completion_mode: next.completion_mode || current.completion_mode,
    planned_files: uniqueStrings([...(current.planned_files || []), ...(next.planned_files || [])]),
    planned_modules: uniqueStrings([...(current.planned_modules || []), ...(next.planned_modules || [])]),
    locks: next.locks?.length ? next.locks : current.locks || [],
    machine: preferNextMachine ? next.machine : current.machine || next.machine,
    lifecycle: { ...createEmptyLifecycle(), ...(current.lifecycle || {}) },
    artifacts: {
      ...createEmptyArtifacts(),
      ...(current.artifacts || {}),
      branch_cleanup: normalizeBranchCleanupRecord(current.artifacts?.branch_cleanup || next.artifacts?.branch_cleanup),
      change_cost_snapshot: current.artifacts?.change_cost_snapshot || next.artifacts?.change_cost_snapshot || null,
      decision_cards: mergeArtifactList(current.artifacts?.decision_cards, next.artifacts?.decision_cards, "path"),
      diff_summaries: mergeArtifactList(current.artifacts?.diff_summaries, next.artifacts?.diff_summaries, "path"),
      handoff_notes: mergeArtifactList(current.artifacts?.handoff_notes, next.artifacts?.handoff_notes, "recorded_at"),
      iteration_digest: current.artifacts?.iteration_digest || next.artifacts?.iteration_digest || null,
      review_notes: mergeArtifactList(current.artifacts?.review_notes, next.artifacts?.review_notes, "recorded_at"),
      release_notes: mergeArtifactList(current.artifacts?.release_notes, next.artifacts?.release_notes, "release_id"),
      search_evidence: mergeArtifactList(current.artifacts?.search_evidence, next.artifacts?.search_evidence, "recorded_at"),
    },
  });
}

function readCompanionFile(taskLike) {
  const file = getCompanionPath(taskLike);
  return fs.existsSync(file) ? normalizeCompanion(JSON.parse(fs.readFileSync(file, "utf8"))) : null;
}

function readCompanion(taskLike) {
  const companion = readCompanionFile(taskLike);
  return companion ? buildCompatView(companion) : null;
}

function writeCompanion(taskLike, companion) {
  ensureDir();
  const file = getCompanionPath(taskLike);
  fs.writeFileSync(file, JSON.stringify(serializeCompanion(companion), null, 2) + "\n");
}

function ensureCompanion(taskLike) {
  const content = readTaskContent(taskLike);
  if (!content) return { ok: false, error: "Task not found" };
  const record = getTaskRecord(taskLike);
  const parsed = parseTaskToCompanion(taskLike, content);
  if (!parsed || !record) return { ok: false, error: "Task not found" };
  const existing = readCompanionFile(taskLike);
  const canonical = reconcileBranchCleanupForTaskStatus(existing ? mergeCompanion(existing, parsed) : parsed, resolveTaskStatus(record.path, content));
  writeCompanion(taskLike, canonical);
  return { ok: true, companion: buildCompatView(canonical), record };
}

function updateCompanion(taskLike, updater) {
  const ensured = ensureCompanion(taskLike);
  if (!ensured.ok) return ensured;
  const snapshot = JSON.parse(JSON.stringify(ensured.companion));
  const nextCompanion = updater ? updater(snapshot) || ensured.companion : ensured.companion;
  writeCompanion(taskLike, nextCompanion);
  return { ok: true, companion: readCompanion(taskLike), record: ensured.record };
}

function readCompanionReleaseContext(taskLike) {
  const companion = readCompanionFile(taskLike);
  if (!companion) return null;
  const review = companion.lifecycle?.review || null;
  const releaseHandoff = companion.lifecycle?.release_handoff || null;
  return {
    latest_release_id: releaseHandoff?.release_id || companion.artifacts?.release_notes?.slice(-1)[0]?.release_id || null,
    latest_diff_summary_path: review?.diff_summary_path || null,
    latest_decision_card_path: companion.artifacts?.decision_cards?.slice(-1)[0]?.path || null,
  };
}

module.exports = {
  ensureCompanion,
  getCompanionPath,
  getTaskPath,
  normalizeCompanion,
  parseTaskToCompanion,
  readCompanion,
  readCompanionReleaseContext,
  readTaskContent,
  updateCompanion,
  writeCompanion,
};
