/**
 * Task companion JSON read/write for agent-coordination.
 */

const fs = require("node:fs");
const path = require("node:path");
const { extractSection, stripMarkdown } = require("../../ai/lib/markdown-sections.ts");
const { resolveTaskRecord } = require("../../ai/lib/task-resolver.ts");

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

function extractTaskSection(content, ...names) {
  for (const name of names) {
    const value = extractSection(content, name, ROOT);
    if (value) {
      return stripMarkdown(value).replace(/`/g, "").trim();
    }
  }
  return "";
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
    ...(companion.summary_artifacts || []),
    ...artifacts.decision_cards.map((item) => item.path),
    ...artifacts.diff_summaries.map((item) => item.path),
  ]);
}

function syncLegacyFields(companion) {
  const contract = companion.contract || {};
  const synced = {
    ...companion,
    task_id: companion.short_id || companion.task_id,
    short_id: companion.short_id || companion.task_id,
    task_record_id: companion.task_record_id,
    task_path: companion.task_path,
    current_mode: companion.current_mode || "方案评审",
    task_status: companion.task_status || "todo",
    branch_name: contract.branch_name || companion.branch_name,
    base_branch: contract.base_branch || companion.base_branch || "dev",
    planned_files: uniqueStrings(contract.planned_files || companion.planned_files || []),
    planned_modules: uniqueStrings(contract.planned_modules || companion.planned_modules || []),
    risk_assessment: contract.risk_assessment || companion.risk_assessment || "medium",
    execution_mode: contract.execution_mode || companion.execution_mode || "direct_edit",
    status: normalizeLegacyStatus(companion.task_status || "todo"),
    ui_validation_required: Boolean(contract.ui_validation_required || companion.ui_validation_required),
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
  synced.contract = {
    branch_name: synced.branch_name,
    base_branch: synced.base_branch,
    planned_files: synced.planned_files,
    planned_modules: synced.planned_modules,
    risk_assessment: synced.risk_assessment,
    execution_mode: synced.execution_mode,
    ui_validation_required: synced.ui_validation_required,
  };
  synced.companion_phase = buildCompanionPhase(synced);
  synced.summary_artifacts = collectSummaryArtifacts(synced);
  return synced;
}

function parseTaskToCompanion(taskLike, content) {
  const record = getTaskRecord(taskLike);
  if (!record) return null;

  const goal = extractTaskSection(content, "goal", "目标") || record.title;
  const branch = extractTaskSection(content, "branch", "分支");
  const currentMode = extractTaskSection(content, "current_mode", "当前模式") || "方案评审";
  const taskStatus = extractTaskSection(content, "status", "状态").toLowerCase() || "todo";
  const related = extractSection(content, "related_modules", ROOT) || extractSection(content, "关联模块", ROOT) || "";
  const modules = uniqueStrings((related.match(/`([^`]+)`/g) || []).map((item) => item.replace(/`/g, "")));
  const plannedFiles = modules.filter((item) => item.includes("/") || /\.(md|ts|tsx|js|json|yaml|yml)$/.test(item));
  if (!plannedFiles.includes(record.path)) {
    plannedFiles.unshift(record.path);
  }

  return syncLegacyFields({
    schema_version: "1",
    task_id: record.shortId,
    short_id: record.shortId,
    task_record_id: record.id,
    task_path: record.path,
    title: record.title,
    goal,
    owner_agent: "default",
    human_decision_needed: false,
    human_decision_reason: null,
    current_mode: currentMode,
    task_status: taskStatus,
    truth_boundaries: {
      task_document: record.path,
      release_registry: "runtime registry.json",
      companion_role: "derived machine-readable delivery contract",
    },
    contract: {
      branch_name: branch || `codex/${record.id}`,
      base_branch: "dev",
      planned_files: plannedFiles,
      planned_modules: modules.filter((item) => !plannedFiles.includes(item)),
      risk_assessment: "medium",
      execution_mode: "direct_edit",
      ui_validation_required: false,
    },
    lifecycle: createEmptyLifecycle(),
    artifacts: createEmptyArtifacts(),
    summary_artifacts: [],
  });
}

function mergeCompanion(existing, parsed) {
  return syncLegacyFields({
    ...existing,
    ...parsed,
    truth_boundaries: { ...(existing.truth_boundaries || {}), ...(parsed.truth_boundaries || {}) },
    contract: {
      ...(existing.contract || {}),
      ...(parsed.contract || {}),
      planned_files: parsed.contract.planned_files,
      planned_modules: parsed.contract.planned_modules,
    },
    lifecycle: { ...createEmptyLifecycle(), ...(existing.lifecycle || {}) },
    artifacts: {
      ...createEmptyArtifacts(),
      ...(existing.artifacts || {}),
      decision_cards: mergeArtifactList(existing.artifacts?.decision_cards, parsed.artifacts?.decision_cards, "path"),
      diff_summaries: mergeArtifactList(existing.artifacts?.diff_summaries, parsed.artifacts?.diff_summaries, "path"),
      handoff_notes: mergeArtifactList(existing.artifacts?.handoff_notes, parsed.artifacts?.handoff_notes, "recorded_at"),
      review_notes: mergeArtifactList(existing.artifacts?.review_notes, parsed.artifacts?.review_notes, "recorded_at"),
      release_notes: mergeArtifactList(existing.artifacts?.release_notes, parsed.artifacts?.release_notes, "release_id"),
    },
  });
}

function readCompanion(taskLike) {
  const file = getCompanionPath(taskLike);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

function writeCompanion(taskLike, companion) {
  ensureDir();
  const file = getCompanionPath(taskLike);
  fs.writeFileSync(file, JSON.stringify(syncLegacyFields(companion), null, 2) + "\n");
}

function ensureCompanion(taskLike) {
  const content = readTaskContent(taskLike);
  if (!content) return { ok: false, error: "Task not found" };
  const parsed = parseTaskToCompanion(taskLike, content);
  const companion = readCompanion(taskLike) ? mergeCompanion(readCompanion(taskLike), parsed) : parsed;
  writeCompanion(taskLike, companion);
  return { ok: true, companion, record: getTaskRecord(taskLike) };
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
  const companion = readCompanion(taskLike);
  if (!companion) return null;
  const handoff = companion.lifecycle?.handoff || null;
  const review = companion.lifecycle?.review || null;
  const releaseHandoff = companion.lifecycle?.release_handoff || null;
  return {
    delivery_summary: releaseHandoff?.delivery_summary || handoff?.summary || `${companion.short_id} ${companion.title}`.trim(),
    delivery_benefit: releaseHandoff?.delivery_benefit || handoff?.delivery_benefit || null,
    delivery_risks: releaseHandoff?.delivery_risks || review?.merge_decision_explanation || null,
    latest_diff_summary_path: review?.diff_summary_path || null,
    latest_decision_card_path: companion.artifacts?.decision_cards?.slice(-1)[0]?.path || null,
  };
}

module.exports = {
  ensureCompanion,
  getCompanionPath,
  getTaskPath,
  parseTaskToCompanion,
  readCompanion,
  readCompanionReleaseContext,
  readTaskContent,
  updateCompanion,
  writeCompanion,
};
