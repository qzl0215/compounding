const { formatEstimatedTokens } = require("../../../shared/ai-efficiency.ts");
const { normalizeGainEvent, readCommandGainEvents } = require("./command-gain.ts");
const DETERMINISTIC_SHORTCUTS = new Set(["preflight_summary", "review_summary", "preview_summary", "prod_summary"]);

function normalizeString(value, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseSince(rawValue) {
  const normalized = normalizeString(rawValue);
  if (!normalized) return null;
  const epoch = Date.parse(normalized);
  if (!Number.isFinite(epoch)) return null;
  return new Date(epoch);
}

function formatDurationMs(value) {
  const duration = Math.max(0, Math.round(toNumber(value)));
  if (duration >= 60 * 60 * 1000) {
    const hours = Math.round((duration / (60 * 60 * 1000)) * 10) / 10;
    return `${hours}h`;
  }
  if (duration >= 60 * 1000) {
    const minutes = Math.round((duration / (60 * 1000)) * 10) / 10;
    return `${minutes}m`;
  }
  return `${Math.max(1, Math.round(duration / 1000))}s`;
}

function buildRetroWindow(since, generatedAt) {
  const deltaMs = Math.max(1, generatedAt.getTime() - since.getTime());
  const hours = Math.max(1, Math.ceil(deltaMs / (60 * 60 * 1000)));
  if (hours <= 24) return `${hours}h`;
  return `${Math.max(1, Math.ceil(hours / 24))}d`;
}

function filterEventsSince(events, since, taskId = null) {
  const sinceEpoch = since.getTime();
  const normalizedTaskId = normalizeString(taskId) || null;
  return events
    .map(normalizeGainEvent)
    .filter((event) => {
      const epoch = Date.parse(normalizeString(event.timestamp));
      if (Number.isFinite(epoch) && epoch < sinceEpoch) return false;
      if (!normalizedTaskId) return true;
      return normalizeString(event.task_id) === normalizedTaskId;
    });
}

function averageSavedByShortcut(events, shortcutId) {
  const normalizedShortcutId = normalizeString(shortcutId);
  const matchingRuns = events
    .filter((event) => event.event_kind === "summary_run")
    .filter((event) => normalizeString(event.shortcut_id) === normalizedShortcutId);
  if (!matchingRuns.length) return 0;
  const totalSaved = matchingRuns.reduce((sum, event) => sum + Math.max(0, toNumber(event.saved_tokens_est)), 0);
  return totalSaved / matchingRuns.length;
}

function formatMissedShortcutHint(shortcutId, missedSavingsEst) {
  const normalizedShortcutId = normalizeString(shortcutId);
  if (!normalizedShortcutId || toNumber(missedSavingsEst) <= 0) return null;
  return `本轮未使用 ${normalizedShortcutId}，潜在可节省 ~${formatEstimatedTokens(toNumber(missedSavingsEst))} tokens`;
}

function buildTopHint(root, { taskId = null, since, generatedAt }) {
  try {
    const { buildContextRetroReport } = require("./context-retro.ts");
    const report = buildContextRetroReport(root, {
      taskId: normalizeString(taskId) || null,
      window: buildRetroWindow(since, generatedAt),
    });
    const taskShortcutAlert = (report?.current_task?.alerts || []).find((item) =>
      normalizeString(item?.signature).startsWith("shortcut:")
    );
    if (taskShortcutAlert) {
      const shortcutId = normalizeString(taskShortcutAlert.signature).replace(/^shortcut:/, "");
      const hint = formatMissedShortcutHint(shortcutId, taskShortcutAlert.missed_savings_est);
      if (hint) return hint;
    }
    const taskAlert = (report?.current_task?.alerts || []).find(
      (item) => !normalizeString(item?.signature).startsWith("shortcut:")
    );
    if (taskAlert) {
      return `${normalizeString(taskAlert.signature)}：${normalizeString(taskAlert.next_agent_should_do_instead)}`;
    }
    const missedShortcut = report?.top_missed_shortcuts?.[0];
    if (missedShortcut) {
      const hint = formatMissedShortcutHint(missedShortcut.shortcut_id, missedShortcut.missed_savings_est);
      if (hint) return hint;
    }
  } catch {}

  const filteredEvents = filterEventsSince(readCommandGainEvents(root), since, taskId);
  const fallbackRows = filteredEvents
    .filter((event) => event.event_kind === "shortcut_opportunity")
    .filter((event) => DETERMINISTIC_SHORTCUTS.has(normalizeString(event.shortcut_id)))
    .filter((event) => event.adopted !== true)
    .reduce((acc, event) => {
      const shortcutId = normalizeString(event.shortcut_id);
      const current = acc.get(shortcutId) || { shortcut_id: shortcutId, count: 0, missed_savings_est: 0 };
      current.count += 1;
      current.missed_savings_est = Math.round(current.count * averageSavedByShortcut(filteredEvents, shortcutId));
      acc.set(shortcutId, current);
      return acc;
    }, new Map());

  const topFallback = Array.from(fallbackRows.values()).sort(
    (left, right) => right.missed_savings_est - left.missed_savings_est || right.count - left.count
  )[0];
  if (topFallback?.shortcut_id) {
    return formatMissedShortcutHint(topFallback.shortcut_id, topFallback.missed_savings_est);
  }
  return null;
}

function buildTurnReport(root = process.cwd(), options = {}) {
  const since = parseSince(options.since);
  if (!since) {
    throw new Error("since is required and must be a valid ISO timestamp.");
  }
  const generatedAt = new Date();
  const taskId = normalizeString(options.taskId) || null;
  const events = filterEventsSince(readCommandGainEvents(root), since, taskId);
  const summaryEvents = events.filter((event) => event.event_kind === "summary_run");
  const contextEvents = events.filter((event) => event.event_kind === "context_packet");
  const sum = (rows, field) => rows.reduce((total, row) => total + Math.max(0, toNumber(row[field])), 0);

  return {
    ok: true,
    since: since.toISOString(),
    generated_at: generatedAt.toISOString(),
    task_id: taskId,
    elapsed_ms: Math.max(0, generatedAt.getTime() - since.getTime()),
    summary_runs: summaryEvents.length,
    context_packets: contextEvents.length,
    summary_input_tokens_est: sum(summaryEvents, "input_tokens_est"),
    summary_output_tokens_est: sum(summaryEvents, "output_tokens_est"),
    summary_saved_tokens_est: sum(summaryEvents, "saved_tokens_est"),
    context_input_tokens_est: sum(contextEvents, "input_tokens_est"),
    context_output_tokens_est: sum(contextEvents, "output_tokens_est"),
    context_saved_tokens_est: sum(contextEvents, "saved_tokens_est"),
    total_input_tokens_est: sum(summaryEvents, "input_tokens_est") + sum(contextEvents, "input_tokens_est"),
    total_output_tokens_est: sum(summaryEvents, "output_tokens_est") + sum(contextEvents, "output_tokens_est"),
    total_saved_tokens_est: sum(summaryEvents, "saved_tokens_est") + sum(contextEvents, "saved_tokens_est"),
    top_hint: buildTopHint(root, { taskId, since, generatedAt }),
  };
}

function formatTurnReportText(report = {}) {
  const lines = [
    "回合量化",
    `- 耗时：${formatDurationMs(report.elapsed_ms)}`,
    `- Token：~${formatEstimatedTokens(toNumber(report.total_input_tokens_est))} -> ${formatEstimatedTokens(toNumber(report.total_output_tokens_est))}，saved ~${formatEstimatedTokens(toNumber(report.total_saved_tokens_est))}`,
    `- 上下文：${Math.max(0, Math.round(toNumber(report.context_packets)))} packets；摘要：${Math.max(0, Math.round(toNumber(report.summary_runs)))} runs`,
  ];
  const hint = normalizeString(report.top_hint);
  if (hint) {
    lines.push(`- 提示：${hint}`);
  }
  return lines.join("\n");
}

module.exports = {
  buildTurnReport,
  formatTurnReportText,
  parseSince,
};
