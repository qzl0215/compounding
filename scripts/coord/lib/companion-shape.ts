const { normalizeBranchCleanupRecord } = require("../../../shared/branch-cleanup.ts");
const {
  deriveCompatTaskMachine,
  deriveTaskStatusFromStateId,
  normalizeTaskMachineState,
} = require("../../../shared/task-state-machine.ts");

function cleanString(value, fallback = "") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function uniqueStrings(values) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
}

function mergeArtifactList(existing = [], incoming = [], key = "path") {
  const merged = [];
  const seen = new Set();
  for (const item of [...existing, ...incoming]) {
    const signature =
      item && typeof item === "object" && key in item ? `${key}:${item[key]}` : JSON.stringify(item);
    if (!signature || seen.has(signature)) continue;
    seen.add(signature);
    merged.push(item);
  }
  return merged;
}

function createEmptyLifecycle() {
  return {
    created: null,
    pre_task: null,
    handoff: null,
    review: null,
    release_handoff: null,
  };
}

function createEmptyArtifacts() {
  return {
    branch_cleanup: null,
    change_cost_snapshot: null,
    decision_cards: [],
    diff_summaries: [],
    handoff_notes: [],
    iteration_digest: null,
    review_notes: [],
    release_notes: [],
    search_evidence: [],
  };
}

function createEmptyMachine() {
  return {
    state_id: "planning",
    mode_id: "planning",
    delivery_track: "undetermined",
    blocked_from_state: null,
    resume_to_state: null,
    blocked_reason: null,
    last_transition: null,
  };
}

function normalizeLocks(locks = []) {
  return (Array.isArray(locks) ? locks : [])
    .filter((lock) => lock && typeof lock === "object")
    .map((lock) => ({
      lock_id: cleanString(lock.lock_id),
      target_type: cleanString(lock.target_type || "file"),
      target: cleanString(lock.target),
      owner_task_id: cleanString(lock.owner_task_id),
      owner_agent: cleanString(lock.owner_agent),
      status: cleanString(lock.status || "active"),
    }))
    .filter((lock) => lock.target);
}

function normalizeLegacyStatus(taskStatus) {
  if (taskStatus === "done") return "merged";
  if (taskStatus === "doing") return "active";
  if (taskStatus === "blocked") return "blocked";
  return "planned";
}

function buildCompanionPhase(companion) {
  return companion.machine?.state_id || "planning";
}

function collectSummaryArtifacts(companion) {
  const artifacts = companion.artifacts || createEmptyArtifacts();
  return uniqueStrings([
    ...artifacts.decision_cards.map((item) => item.path),
    ...artifacts.diff_summaries.map((item) => item.path),
  ]);
}

function normalizeCompanion(companion = {}) {
  const lifecycle = { ...createEmptyLifecycle(), ...(companion.lifecycle || {}) };
  const machine = normalizeTaskMachineState(
    companion.machine ||
      deriveCompatTaskMachine({
        task_status: cleanString(companion.status || companion.contract?.status || "", "todo"),
        delivery_track: cleanString(companion.delivery_track || companion.machine?.delivery_track || ""),
        pending_acceptance:
          lifecycle.release_handoff?.channel === "dev" &&
          String(lifecycle.release_handoff?.acceptance_status || "").trim() === "pending",
        released: lifecycle.release_handoff?.channel === "prod",
        rolled_back: String(lifecycle.release_handoff?.status || "").trim() === "rolled_back",
        blocked: cleanString(companion.status).toLowerCase() === "blocked",
        has_handoff: Boolean(lifecycle.handoff),
        has_review: Boolean(lifecycle.review),
      }),
  );
  const normalized = {
    schema_version: cleanString(companion.schema_version, "4"),
    task_id: cleanString(companion.short_id || companion.task_id),
    task_path: cleanString(companion.task_path),
    contract_hash: cleanString(companion.contract_hash),
    branch_name: cleanString(companion.branch_name || companion.contract?.branch_name, ""),
    completion_mode: cleanString(companion.completion_mode, "close_full_contract"),
    planned_files: uniqueStrings(companion.planned_files || companion.contract?.planned_files || []),
    planned_modules: uniqueStrings(companion.planned_modules || companion.contract?.planned_modules || []),
    locks: normalizeLocks(companion.locks),
    lifecycle,
    machine: machine || createEmptyMachine(),
    artifacts: {
      ...createEmptyArtifacts(),
      ...(companion.artifacts || {}),
      branch_cleanup: normalizeBranchCleanupRecord(companion.artifacts?.branch_cleanup),
      change_cost_snapshot: companion.artifacts?.change_cost_snapshot || null,
      decision_cards: mergeArtifactList(companion.artifacts?.decision_cards, [], "path"),
      diff_summaries: mergeArtifactList(companion.artifacts?.diff_summaries, [], "path"),
      handoff_notes: mergeArtifactList(companion.artifacts?.handoff_notes, [], "recorded_at"),
      iteration_digest: companion.artifacts?.iteration_digest || null,
      review_notes: mergeArtifactList(companion.artifacts?.review_notes, [], "recorded_at"),
      release_notes: mergeArtifactList(companion.artifacts?.release_notes, [], "release_id"),
      search_evidence: mergeArtifactList(companion.artifacts?.search_evidence, [], "recorded_at"),
    },
  };

  return normalized;
}

function buildCompatView(companion) {
  const normalized = normalizeCompanion(companion);
  return {
    ...normalized,
    short_id: normalized.task_id,
    branch_name: normalized.branch_name,
    planned_files: normalized.planned_files,
    planned_modules: normalized.planned_modules,
    status: normalizeLegacyStatus(deriveTaskStatusFromStateId(normalized.machine.state_id)),
    companion_phase: buildCompanionPhase(normalized),
    summary_artifacts: collectSummaryArtifacts(normalized),
  };
}

module.exports = {
  buildCompatView,
  buildCompanionPhase,
  cleanString,
  collectSummaryArtifacts,
  createEmptyArtifacts,
  createEmptyMachine,
  createEmptyLifecycle,
  mergeArtifactList,
  normalizeCompanion,
  normalizeLegacyStatus,
  uniqueStrings,
};
