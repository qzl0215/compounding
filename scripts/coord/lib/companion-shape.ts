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
    decision_cards: [],
    diff_summaries: [],
    handoff_notes: [],
    review_notes: [],
    release_notes: [],
  };
}

function normalizeTaskStatus(value) {
  const normalized = cleanString(value).toLowerCase();
  if (normalized === "已完成" || normalized === "done" || normalized === "merged") return "done";
  if (normalized === "阻塞中" || normalized === "blocked") return "blocked";
  if (normalized === "进行中" || normalized === "doing" || normalized === "in_progress") return "doing";
  if (normalized === "待开始" || normalized === "todo" || normalized === "planned") return "todo";
  return normalized || "todo";
}

function normalizeLegacyStatus(taskStatus) {
  if (taskStatus === "done") return "merged";
  if (taskStatus === "doing") return "active";
  if (taskStatus === "blocked") return "blocked";
  return "planned";
}

function buildCompanionPhase(companion) {
  if (companion.lifecycle?.release_handoff?.channel === "prod") return "released";
  if (companion.lifecycle?.release_handoff) return "release_handoff";
  if (companion.lifecycle?.review) return "reviewed";
  if (companion.lifecycle?.handoff) return "handoff_ready";
  if (companion.lifecycle?.pre_task) return "pre_task_checked";
  if (companion.lifecycle?.created) return "created";
  return "initialized";
}

function collectSummaryArtifacts(companion) {
  const artifacts = companion.artifacts || createEmptyArtifacts();
  return uniqueStrings([
    ...artifacts.decision_cards.map((item) => item.path),
    ...artifacts.diff_summaries.map((item) => item.path),
  ]);
}

function normalizeContract(companion = {}) {
  const contract = companion.contract || {};
  return {
    branch_name: cleanString(contract.branch_name || companion.branch_name, ""),
    base_branch: cleanString(contract.base_branch || companion.base_branch, "dev"),
    planned_files: uniqueStrings(contract.planned_files || companion.planned_files || []),
    planned_modules: uniqueStrings(contract.planned_modules || companion.planned_modules || []),
    risk_assessment: cleanString(contract.risk_assessment || companion.risk_assessment, "medium"),
    execution_mode: cleanString(contract.execution_mode || companion.execution_mode, "direct_edit"),
    ui_validation_required: Boolean(
      contract.ui_validation_required ?? companion.ui_validation_required ?? false
    ),
  };
}

function normalizeCompanion(companion = {}) {
  const normalized = {
    schema_version: cleanString(companion.schema_version, "2"),
    task_id: cleanString(companion.short_id || companion.task_id),
    short_id: cleanString(companion.short_id || companion.task_id),
    task_record_id: cleanString(companion.task_record_id),
    task_path: cleanString(companion.task_path),
    title: cleanString(companion.title),
    goal: cleanString(companion.goal || companion.title),
    owner_agent: cleanString(companion.owner_agent, "default"),
    human_decision_needed: Boolean(companion.human_decision_needed),
    human_decision_reason: companion.human_decision_reason ? cleanString(companion.human_decision_reason) : null,
    current_mode: cleanString(companion.current_mode, "方案评审"),
    task_status: normalizeTaskStatus(companion.task_status || companion.status),
    truth_boundaries: {
      task_document: cleanString(companion.truth_boundaries?.task_document || companion.task_path),
      release_registry: cleanString(companion.truth_boundaries?.release_registry, "runtime registry.json"),
      companion_role: cleanString(
        companion.truth_boundaries?.companion_role,
        "derived machine-readable delivery contract"
      ),
    },
    contract: normalizeContract(companion),
    lifecycle: { ...createEmptyLifecycle(), ...(companion.lifecycle || {}) },
    artifacts: {
      ...createEmptyArtifacts(),
      ...(companion.artifacts || {}),
      decision_cards: mergeArtifactList(companion.artifacts?.decision_cards, [], "path"),
      diff_summaries: mergeArtifactList(companion.artifacts?.diff_summaries, [], "path"),
      handoff_notes: mergeArtifactList(companion.artifacts?.handoff_notes, [], "recorded_at"),
      review_notes: mergeArtifactList(companion.artifacts?.review_notes, [], "recorded_at"),
      release_notes: mergeArtifactList(companion.artifacts?.release_notes, [], "release_id"),
    },
  };

  if (!normalized.task_id && normalized.task_record_id) {
    normalized.task_id = normalized.task_record_id;
  }
  if (!normalized.short_id && normalized.task_id) {
    normalized.short_id = normalized.task_id;
  }

  return normalized;
}

function buildCompatView(companion) {
  const normalized = normalizeCompanion(companion);
  return {
    ...normalized,
    branch_name: normalized.contract.branch_name,
    base_branch: normalized.contract.base_branch,
    planned_files: normalized.contract.planned_files,
    planned_modules: normalized.contract.planned_modules,
    risk_assessment: normalized.contract.risk_assessment,
    execution_mode: normalized.contract.execution_mode,
    ui_validation_required: normalized.contract.ui_validation_required,
    status: normalizeLegacyStatus(normalized.task_status),
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
  createEmptyLifecycle,
  mergeArtifactList,
  normalizeCompanion,
  normalizeLegacyStatus,
  normalizeTaskStatus,
  uniqueStrings,
};
