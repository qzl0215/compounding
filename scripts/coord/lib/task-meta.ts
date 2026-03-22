/**
 * Task companion JSON read/write for agent-coordination.
 */

const fs = require("node:fs");
const path = require("node:path");
const { resolveTaskRecord } = require("../../ai/lib/task-resolver.ts");
const { parseTaskContract } = require("../../../shared/task-contract.ts");
const {
  buildCompatView,
  createEmptyArtifacts,
  createEmptyLifecycle,
  mergeArtifactList,
  normalizeCompanion,
  normalizeTaskStatus,
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

function parseTaskToCompanion(taskLike, content) {
  const record = getTaskRecord(taskLike);
  if (!record) return null;

  const parsed = parseTaskContract(record.path, content);
  const goal = parsed.summary || record.title;
  const branch = parsed.branch;
  const currentMode = parsed.currentMode;
  const taskStatus = normalizeTaskStatus(parsed.status);
  const modules = uniqueStrings(parsed.relatedModules);
  const plannedFiles = modules.filter((item) => item.includes("/") || /\.(md|ts|tsx|js|json|yaml|yml)$/.test(item));
  if (!plannedFiles.includes(record.path)) {
    plannedFiles.unshift(record.path);
  }

  return normalizeCompanion({
    schema_version: "2",
    task_id: record.shortId,
    short_id: record.shortId,
    task_record_id: record.id,
    task_path: record.path,
    title: record.title,
    goal,
    owner_agent: "default",
    human_decision_needed: false,
    human_decision_reason: null,
    current_mode: currentMode || undefined,
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
  });
}

function mergeCompanion(existing, parsed) {
  const current = normalizeCompanion(existing);
  const next = normalizeCompanion(parsed);
  return normalizeCompanion({
    ...current,
    task_id: next.task_id || current.task_id,
    short_id: next.short_id || current.short_id,
    task_record_id: next.task_record_id || current.task_record_id,
    task_path: next.task_path || current.task_path,
    title: next.title || current.title,
    goal: next.goal || current.goal,
    current_mode: next.current_mode || current.current_mode,
    task_status: next.task_status || current.task_status,
    truth_boundaries: { ...(current.truth_boundaries || {}), ...(next.truth_boundaries || {}) },
    contract: {
      ...(current.contract || {}),
      ...(next.contract || {}),
      planned_files: uniqueStrings([...(current.contract?.planned_files || []), ...(next.contract?.planned_files || [])]),
      planned_modules: uniqueStrings([
        ...(current.contract?.planned_modules || []),
        ...(next.contract?.planned_modules || []),
      ]),
    },
    lifecycle: { ...createEmptyLifecycle(), ...(current.lifecycle || {}) },
    artifacts: {
      ...createEmptyArtifacts(),
      ...(current.artifacts || {}),
      decision_cards: mergeArtifactList(current.artifacts?.decision_cards, next.artifacts?.decision_cards, "path"),
      diff_summaries: mergeArtifactList(current.artifacts?.diff_summaries, next.artifacts?.diff_summaries, "path"),
      handoff_notes: mergeArtifactList(current.artifacts?.handoff_notes, next.artifacts?.handoff_notes, "recorded_at"),
      review_notes: mergeArtifactList(current.artifacts?.review_notes, next.artifacts?.review_notes, "recorded_at"),
      release_notes: mergeArtifactList(current.artifacts?.release_notes, next.artifacts?.release_notes, "release_id"),
    },
    human_decision_needed: Boolean(current.human_decision_needed),
    human_decision_reason: current.human_decision_reason || null,
    owner_agent: current.owner_agent || next.owner_agent || "default",
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
  const parsed = parseTaskToCompanion(taskLike, content);
  const existing = readCompanionFile(taskLike);
  const canonical = existing ? mergeCompanion(existing, parsed) : parsed;
  writeCompanion(taskLike, canonical);
  return { ok: true, companion: buildCompatView(canonical), record: getTaskRecord(taskLike) };
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
  const handoff = companion.lifecycle?.handoff || null;
  const review = companion.lifecycle?.review || null;
  const releaseHandoff = companion.lifecycle?.release_handoff || null;
  return {
    delivery_summary:
      releaseHandoff?.delivery_summary || handoff?.summary || `${companion.short_id} ${companion.title}`.trim(),
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
  normalizeCompanion,
  parseTaskToCompanion,
  readCompanion,
  readCompanionReleaseContext,
  readTaskContent,
  updateCompanion,
  writeCompanion,
};
