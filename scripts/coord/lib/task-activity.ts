const fs = require("node:fs");
const path = require("node:path");
const { resolveTaskRecord, resolveTaskId } = require("../../ai/lib/task-resolver.ts");
const { buildRetroCandidates, deriveRetroPattern, loadIterationDigests, renderRetroCandidatesMarkdown } = require("../../ai/lib/retro-candidates.ts");
const { getCompanionPath, updateCompanion } = require("./task-meta.ts");

const ROOT = process.cwd();
const ACTIVITY_ROOT = path.join(ROOT, "output", "agent_session", "task-activity");
const RETRO_DIR = path.join(ROOT, "output", "ai", "retro-candidates");
const RETRO_JSON = path.join(RETRO_DIR, "latest.json");
const RETRO_MD = path.join(RETRO_DIR, "latest.md");
const CURRENT_FILE = "current.json";
const RAW_TTL_MS = 24 * 60 * 60 * 1000;
const ACTIVE_STAGES = new Set(["preflight", "execution", "review", "release_prepare", "rollback"]);
const WAIT_STAGES = new Set(["review_wait", "acceptance_wait"]);
const NOTE_STAGES = new Set(["search_evidence", "blocker"]);

function nowIso(value) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function uniqueStrings(values = []) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
}

function buildEmptyDigest() {
  return {
    updated_at: null,
    attempt_count: 0,
    active_ms_by_stage: {},
    wait_ms_by_stage: {},
    top_blockers: [],
    last_attempt: null,
    next_agent_hints: [],
  };
}

function resolveTaskMeta(taskLike) {
  const record = resolveTaskRecord(taskLike, ROOT);
  if (record) {
    return {
      task_key: record.id,
      task_id: record.shortId,
      task_path: record.path,
    };
  }
  const raw = String(taskLike || "").trim();
  const canonical = resolveTaskId(raw, ROOT) || raw.replace(/^t-/, "task-").replace(/\.md$/, "");
  return {
    task_key: canonical,
    task_id: raw || canonical,
    task_path: null,
  };
}

function taskDir(meta) {
  return path.join(ACTIVITY_ROOT, meta.task_key);
}

function currentStatePath(meta) {
  return path.join(taskDir(meta), CURRENT_FILE);
}

function attemptPath(meta, attemptId) {
  return path.join(taskDir(meta), `${attemptId}.jsonl`);
}

function readCurrentState(meta) {
  const file = currentStatePath(meta);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function writeCurrentState(meta, state) {
  ensureDir(taskDir(meta));
  const file = currentStatePath(meta);
  if (!state) {
    fs.rmSync(file, { force: true });
    return;
  }
  fs.writeFileSync(file, JSON.stringify(state, null, 2) + "\n", "utf8");
}

function createAttemptState(meta, recordedAt) {
  const stamp = new Date(recordedAt).toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 6);
  return {
    task_id: meta.task_id,
    task_key: meta.task_key,
    task_path: meta.task_path,
    attempt_id: `attempt-${stamp}-${random}`,
    started_at: recordedAt,
    last_recorded_at: recordedAt,
    open_stage: null,
  };
}

function stageKind(stage) {
  if (ACTIVE_STAGES.has(stage)) return "active";
  if (WAIT_STAGES.has(stage)) return "wait";
  if (NOTE_STAGES.has(stage)) return "note";
  return "note";
}

function appendRawEvent(meta, attemptId, event) {
  ensureDir(taskDir(meta));
  fs.appendFileSync(attemptPath(meta, attemptId), JSON.stringify(event) + "\n", "utf8");
}

function durationBetween(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return 0;
  return Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt));
}

function closeOpenStage(meta, state, { recordedAt, status = "interrupted", reason = "阶段被自动关闭。" } = {}) {
  if (!state?.open_stage) return state;
  const endedAt = nowIso(recordedAt || state.last_recorded_at || new Date().toISOString());
  const durationMs = durationBetween(state.open_stage.started_at || state.started_at, endedAt);
  appendRawEvent(meta, state.attempt_id, {
    task_id: meta.task_id,
    attempt_id: state.attempt_id,
    event_type: state.open_stage.kind === "wait" ? "wait_finished" : "phase_finished",
    stage: state.open_stage.stage,
    recorded_at: endedAt,
    duration_ms: durationMs,
    status,
    reason,
    source: state.open_stage.source || "coord:auto-close",
  });
  state.open_stage = null;
  state.last_recorded_at = endedAt;
  return state;
}

function ensureAttempt(meta, { recordedAt, forceNewAttempt = false } = {}) {
  const at = nowIso(recordedAt);
  let state = readCurrentState(meta);
  if (!state || !state.attempt_id || forceNewAttempt) {
    if (state?.open_stage) {
      state = closeOpenStage(meta, state, {
        recordedAt: state.last_recorded_at || at,
        status: "interrupted",
        reason: "新 attempt 开始前自动关闭旧阶段。",
      });
    }
    state = createAttemptState(meta, at);
    writeCurrentState(meta, state);
  }
  return state;
}

function readAttemptEvents(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((left, right) => Date.parse(left.recorded_at || 0) - Date.parse(right.recorded_at || 0));
}

function aggregateAttempt(events = []) {
  const activeMs = {};
  const waitMs = {};
  const blockers = new Map();
  for (const event of events) {
    if ((event.event_type === "phase_finished" || event.event_type === "wait_finished") && Number.isFinite(event.duration_ms)) {
      const bucket = event.event_type === "wait_finished" ? waitMs : activeMs;
      bucket[event.stage] = (bucket[event.stage] || 0) + Number(event.duration_ms || 0);
    }
    if (event.event_type === "blocker") {
      const signature = event.signature || `${event.stage}:${String(event.reason || "").trim()}`;
      const derived = deriveRetroPattern({ signature, stage: event.stage, reason: event.reason || "" });
      const existing = blockers.get(signature) || {
        signature,
        stage: event.stage,
        reason: event.reason || "",
        repeat_count: 0,
        lost_time_ms: 0,
        last_seen_at: event.recorded_at,
        related_docs: [],
        why_it_repeats: derived.why_it_repeats,
        suggested_shortcut: derived.suggested_shortcut,
        promotion_hint: derived.promotion_hint,
      };
      existing.repeat_count += 1;
      existing.lost_time_ms += Number(event.duration_ms || 0);
      existing.last_seen_at = event.recorded_at;
      existing.related_docs = uniqueStrings([...(existing.related_docs || []), ...(event.related_docs || []), ...derived.related_docs]);
      blockers.set(signature, existing);
    }
  }

  const blockerList = Array.from(blockers.values()).sort((left, right) => {
    if (right.lost_time_ms !== left.lost_time_ms) return right.lost_time_ms - left.lost_time_ms;
    if (right.repeat_count !== left.repeat_count) return right.repeat_count - left.repeat_count;
    return left.signature.localeCompare(right.signature, "zh-Hans-CN");
  });

  const stageTotals = [
    ...Object.entries(activeMs).map(([stage, duration]) => ({ stage, duration })),
    ...Object.entries(waitMs).map(([stage, duration]) => ({ stage, duration })),
  ].sort((left, right) => right.duration - left.duration);

  const dominantStage = stageTotals[0]?.stage || null;
  const dominantBlocker = blockerList[0] || null;
  const startedAt = events[0]?.recorded_at || null;
  const endedAt = events[events.length - 1]?.recorded_at || null;
  const summaryParts = [];
  if (dominantStage) summaryParts.push(`主要耗时在 ${dominantStage}`);
  if (dominantBlocker?.reason) summaryParts.push(`主要阻塞是 ${dominantBlocker.reason}`);

  return {
    started_at: startedAt,
    ended_at: endedAt,
    active_ms_by_stage: activeMs,
    wait_ms_by_stage: waitMs,
    blockers: blockerList,
    last_attempt: {
      attempt_id: events[0]?.attempt_id || null,
      started_at: startedAt,
      ended_at: endedAt,
      dominant_stage: dominantStage,
      dominant_blocker: dominantBlocker?.reason || null,
      summary: summaryParts.join("；") || "最近一次 attempt 未识别出明显耗时或阻塞。",
    },
  };
}

function mergeStageTotals(existing = {}, incoming = {}) {
  const merged = { ...(existing || {}) };
  for (const [stage, duration] of Object.entries(incoming || {})) {
    merged[stage] = Number(merged[stage] || 0) + Number(duration || 0);
  }
  return merged;
}

function mergeBlockers(existing = [], incoming = []) {
  const aggregated = new Map();
  for (const blocker of [...(existing || []), ...(incoming || [])]) {
    if (!blocker?.signature) continue;
    const current = aggregated.get(blocker.signature) || {
      signature: blocker.signature,
      stage: blocker.stage || null,
      reason: blocker.reason || null,
      repeat_count: 0,
      lost_time_ms: 0,
      last_seen_at: blocker.last_seen_at || null,
      related_docs: [],
      why_it_repeats: blocker.why_it_repeats || "",
      suggested_shortcut: blocker.suggested_shortcut || "",
      promotion_hint: blocker.promotion_hint || "",
    };
    current.repeat_count += Number(blocker.repeat_count || 0);
    current.lost_time_ms += Number(blocker.lost_time_ms || 0);
    current.last_seen_at = blocker.last_seen_at || current.last_seen_at;
    current.related_docs = uniqueStrings([...(current.related_docs || []), ...(blocker.related_docs || [])]);
    if (!current.reason) current.reason = blocker.reason || null;
    if (!current.stage) current.stage = blocker.stage || null;
    if (!current.why_it_repeats) current.why_it_repeats = blocker.why_it_repeats || "";
    if (!current.suggested_shortcut) current.suggested_shortcut = blocker.suggested_shortcut || "";
    if (!current.promotion_hint) current.promotion_hint = blocker.promotion_hint || "";
    aggregated.set(blocker.signature, current);
  }
  return Array.from(aggregated.values())
    .sort((left, right) => {
      if (right.lost_time_ms !== left.lost_time_ms) return right.lost_time_ms - left.lost_time_ms;
      if (right.repeat_count !== left.repeat_count) return right.repeat_count - left.repeat_count;
      return left.signature.localeCompare(right.signature, "zh-Hans-CN");
    })
    .slice(0, 5);
}

function buildNextAgentHints({ lastAttempt, topBlockers }) {
  const hints = [];
  if (lastAttempt?.dominant_stage) {
    hints.push(`上一轮时间主要耗在 ${lastAttempt.dominant_stage}。`);
  }
  if (lastAttempt?.dominant_blocker) {
    hints.push(`最近一次主要 blocker：${lastAttempt.dominant_blocker}。`);
  }
  const repeated = (topBlockers || []).find((item) => Number(item.repeat_count || 0) >= 2);
  if (repeated?.suggested_shortcut) {
    hints.push(`重复弯路：${repeated.reason || repeated.signature}；shortcut：${repeated.suggested_shortcut}`);
  }
  return hints.slice(0, 5);
}

function mergeDigest(existingDigest, compactedSummary) {
  const digest = {
    ...buildEmptyDigest(),
    ...(existingDigest || {}),
  };
  digest.updated_at = new Date().toISOString();
  digest.attempt_count = Number(digest.attempt_count || 0) + 1;
  digest.active_ms_by_stage = mergeStageTotals(digest.active_ms_by_stage, compactedSummary.active_ms_by_stage);
  digest.wait_ms_by_stage = mergeStageTotals(digest.wait_ms_by_stage, compactedSummary.wait_ms_by_stage);
  digest.top_blockers = mergeBlockers(digest.top_blockers, compactedSummary.blockers);

  const lastAttemptEndedAt = Date.parse(compactedSummary.last_attempt?.ended_at || 0);
  const currentLastEndedAt = Date.parse(digest.last_attempt?.ended_at || 0);
  if (!digest.last_attempt || lastAttemptEndedAt >= currentLastEndedAt) {
    digest.last_attempt = compactedSummary.last_attempt;
  }
  digest.next_agent_hints = buildNextAgentHints({
    lastAttempt: digest.last_attempt,
    topBlockers: digest.top_blockers,
  });
  return digest;
}

function refreshRetroCandidates() {
  const digests = loadIterationDigests(ROOT);
  const candidates = buildRetroCandidates({ digests });
  const payload = {
    ok: true,
    generated_at: new Date().toISOString(),
    source_of_truth: "agent-coordination/tasks/*.json artifacts.iteration_digest",
    source_script: "scripts/coord/lib/task-activity.ts",
    candidate_count: candidates.length,
    candidates,
  };
  ensureDir(RETRO_DIR);
  fs.writeFileSync(RETRO_JSON, JSON.stringify(payload, null, 2) + "\n", "utf8");
  fs.writeFileSync(RETRO_MD, renderRetroCandidatesMarkdown(payload), "utf8");
  return payload;
}

function compactExpiredActivity({ now } = {}) {
  if (!fs.existsSync(ACTIVITY_ROOT)) {
    return { compacted: 0, candidates: null };
  }

  const currentTime = Date.parse(nowIso(now));
  let compacted = 0;

  for (const entry of fs.readdirSync(ACTIVITY_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const meta = resolveTaskMeta(entry.name);
    const directory = taskDir(meta);
    let state = readCurrentState(meta);
    const files = fs.readdirSync(directory).filter((name) => name.endsWith(".jsonl"));

    for (const fileName of files) {
      const file = path.join(directory, fileName);
      const attemptId = fileName.replace(/\.jsonl$/, "");
      const events = readAttemptEvents(file);
      if (!events.length) {
        fs.rmSync(file, { force: true });
        continue;
      }
      const lastRecordedAt = Date.parse(events[events.length - 1].recorded_at || 0);
      const isExpired = currentTime - lastRecordedAt >= RAW_TTL_MS;
      if (!isExpired) continue;

      if (state?.attempt_id === attemptId && state?.open_stage) {
        state = closeOpenStage(meta, state, {
          recordedAt: state.last_recorded_at || events[events.length - 1].recorded_at,
          status: "abandoned",
          reason: "超过 24 小时后 compact，自动关闭未完成阶段。",
        });
        writeCurrentState(meta, state);
      }

      const refreshedEvents = readAttemptEvents(file);
      const summary = aggregateAttempt(refreshedEvents);
      updateCompanion(meta.task_key, (companion) => {
        companion.artifacts = companion.artifacts || {};
        companion.artifacts.iteration_digest = mergeDigest(companion.artifacts.iteration_digest, summary);
        return companion;
      });
      fs.rmSync(file, { force: true });
      compacted += 1;

      if (state?.attempt_id === attemptId && !state?.open_stage) {
        writeCurrentState(meta, null);
        state = null;
      }
    }
  }

  const shouldRefreshCandidates = compacted > 0 || fs.existsSync(RETRO_JSON) || loadIterationDigests(ROOT).length > 0;
  return { compacted, candidates: shouldRefreshCandidates ? refreshRetroCandidates() : null };
}

function appendEvent(taskLike, eventType, stage, payload = {}) {
  const meta = resolveTaskMeta(taskLike);
  const recordedAt = nowIso(payload.recordedAt);
  compactExpiredActivity({ now: recordedAt });

  let state;
  const kind = stageKind(stage);
  const forceNewAttempt = eventType === "phase_started" && stage === "preflight";
  state = ensureAttempt(meta, { recordedAt, forceNewAttempt });

  if ((eventType === "phase_started" || eventType === "wait_started") && state.open_stage?.stage === stage && state.open_stage?.kind === kind) {
    return { task_id: meta.task_id, attempt_id: state.attempt_id, path: attemptPath(meta, state.attempt_id) };
  }

  if ((eventType === "phase_started" || eventType === "wait_started") && state.open_stage) {
    state = closeOpenStage(meta, state, {
      recordedAt,
      status: "interrupted",
      reason: `切换到 ${stage} 前自动关闭 ${state.open_stage.stage}。`,
    });
  }

  const openStage = state.open_stage && state.open_stage.stage === stage ? state.open_stage : null;
  if ((eventType === "phase_finished" || eventType === "wait_finished") && payload.ifOpenOnly && !openStage) {
    return { task_id: meta.task_id, attempt_id: state.attempt_id, path: attemptPath(meta, state.attempt_id) };
  }

  const durationMs = Number.isFinite(payload.durationMs)
    ? Number(payload.durationMs)
    : eventType === "phase_finished" || eventType === "wait_finished" || eventType === "blocker"
      ? durationBetween(openStage?.started_at || state.last_recorded_at || state.started_at, recordedAt)
      : undefined;
  const blockerMeta = eventType === "blocker" ? deriveRetroPattern({ signature: payload.signature || "", stage, reason: payload.reason || "" }) : null;
  const event = {
    task_id: meta.task_id,
    attempt_id: state.attempt_id,
    event_type: eventType,
    stage,
    recorded_at: recordedAt,
    status: payload.status || null,
    reason: payload.reason || null,
    source: payload.source || "coord:activity",
  };
  if (eventType === "phase_finished" || eventType === "wait_finished" || eventType === "blocker") {
    event.duration_ms = durationMs;
  }
  if (eventType === "blocker") {
    event.signature = payload.signature || `${stage}:${String(payload.reason || "").trim()}`;
    event.related_docs = uniqueStrings([...(payload.relatedDocs || []), ...(blockerMeta?.related_docs || [])]);
    event.why_it_repeats = payload.whyItRepeats || blockerMeta?.why_it_repeats || "";
    event.suggested_shortcut = payload.suggestedShortcut || blockerMeta?.suggested_shortcut || "";
    event.promotion_hint = payload.promotionHint || blockerMeta?.promotion_hint || "";
  }

  appendRawEvent(meta, state.attempt_id, event);
  state.last_recorded_at = recordedAt;
  if (eventType === "phase_started" || eventType === "wait_started") {
    state.open_stage = {
      stage,
      kind,
      started_at: recordedAt,
      source: payload.source || "coord:activity",
    };
  } else if ((eventType === "phase_finished" || eventType === "wait_finished") && openStage) {
    state.open_stage = null;
  }
  writeCurrentState(meta, state);
  return { task_id: meta.task_id, attempt_id: state.attempt_id, path: attemptPath(meta, state.attempt_id) };
}

function startActiveStage(taskLike, stage, payload = {}) {
  if (!ACTIVE_STAGES.has(stage)) return null;
  return appendEvent(taskLike, "phase_started", stage, payload);
}

function finishActiveStage(taskLike, stage, payload = {}) {
  if (!ACTIVE_STAGES.has(stage)) return null;
  return appendEvent(taskLike, "phase_finished", stage, payload);
}

function finishActiveStageIfOpen(taskLike, stage, payload = {}) {
  return finishActiveStage(taskLike, stage, { ...payload, ifOpenOnly: true });
}

function startWaitStage(taskLike, stage, payload = {}) {
  if (!WAIT_STAGES.has(stage)) return null;
  return appendEvent(taskLike, "wait_started", stage, payload);
}

function finishWaitStage(taskLike, stage, payload = {}) {
  if (!WAIT_STAGES.has(stage)) return null;
  return appendEvent(taskLike, "wait_finished", stage, payload);
}

function finishWaitStageIfOpen(taskLike, stage, payload = {}) {
  return finishWaitStage(taskLike, stage, { ...payload, ifOpenOnly: true });
}

function recordBlocker(taskLike, stage, payload = {}) {
  return appendEvent(taskLike, "blocker", stage, payload);
}

function recordNote(taskLike, stage, payload = {}) {
  return appendEvent(taskLike, "note", stage, payload);
}

function readLatestLiveSummary(taskLike) {
  const meta = resolveTaskMeta(taskLike);
  const directory = taskDir(meta);
  if (!fs.existsSync(directory)) return null;
  const current = readCurrentState(meta);
  const files = fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".jsonl"))
    .sort()
    .reverse();
  for (const fileName of files) {
    if (current?.open_stage && fileName === `${current.attempt_id}.jsonl`) {
      continue;
    }
    const summary = aggregateAttempt(readAttemptEvents(path.join(directory, fileName)));
    if (summary.started_at) {
      return summary;
    }
  }
  return null;
}

function readRetroCandidatePayload() {
  if (!fs.existsSync(RETRO_JSON)) return null;
  try {
    return JSON.parse(fs.readFileSync(RETRO_JSON, "utf8"));
  } catch {
    return null;
  }
}

function buildRetroContext(taskLike) {
  const meta = resolveTaskMeta(taskLike);
  const companionPath = getCompanionPath(taskLike);
  let digest = null;
  if (fs.existsSync(companionPath)) {
    try {
      digest = JSON.parse(fs.readFileSync(companionPath, "utf8"))?.artifacts?.iteration_digest || null;
    } catch {}
  }

  const liveSummary = readLatestLiveSummary(taskLike);
  const retroCandidates = readRetroCandidatePayload();
  const hints = [];
  const dominantStage = liveSummary?.last_attempt?.dominant_stage || digest?.last_attempt?.dominant_stage || null;
  const dominantBlocker = liveSummary?.last_attempt?.dominant_blocker || digest?.last_attempt?.dominant_blocker || null;
  if (dominantStage) {
    hints.push(`上一轮时间主要耗在 ${dominantStage}。`);
  }
  if (dominantBlocker) {
    hints.push(`最近一次主要 blocker：${dominantBlocker}。`);
  }

  const relatedCandidate = retroCandidates?.candidates?.find((candidate) => (candidate.affected_tasks || []).includes(meta.task_id));
  if (relatedCandidate?.suggested_shortcut) {
    hints.push(`重复弯路：${relatedCandidate.signature}；shortcut：${relatedCandidate.suggested_shortcut}`);
  }

  return {
    iteration_digest_path: digest ? companionPath : null,
    retro_candidates_path: fs.existsSync(RETRO_JSON) ? RETRO_JSON : null,
    retro_hints: hints.slice(0, 3),
  };
}

module.exports = {
  ACTIVITY_ROOT,
  RAW_TTL_MS,
  RETRO_JSON,
  buildEmptyDigest,
  buildRetroContext,
  compactExpiredActivity,
  finishActiveStage,
  finishActiveStageIfOpen,
  finishWaitStage,
  finishWaitStageIfOpen,
  readLatestLiveSummary,
  recordBlocker,
  recordNote,
  refreshRetroCandidates,
  resolveTaskMeta,
  startActiveStage,
  startWaitStage,
};
