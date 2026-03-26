const fs = require("node:fs");
const path = require("node:path");
const { AI_EFFICIENCY_SUPPORTED_PROFILES, buildAiEfficiencyDashboard, formatEstimatedTokens } = require("../../../shared/ai-efficiency.ts");

const SCHEMA_VERSION = "1";
const RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;
const EVENTS_RELATIVE_PATH = path.join("output", "ai", "command-gain", "events.jsonl");
const TRUE_DENOMINATOR_SHORTCUTS = new Set(["preflight_summary", "review_summary", "preview_summary", "prod_summary"]);

function normalizeString(value, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value) {
  const parsed = toNumber(value, 0);
  if (parsed < 0) return 0;
  if (parsed > 100) return 100;
  return Number(parsed.toFixed(2));
}

function byteLength(value) {
  return Buffer.byteLength(String(value || ""), "utf8");
}

function estimateTokens(value) {
  return Math.ceil(byteLength(value) / 4);
}

function ensureDirectory(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

function getEventsPath(root = process.cwd()) {
  return path.join(root, EVENTS_RELATIVE_PATH);
}

function resolveAgentSurface(explicitValue) {
  return (
    normalizeString(explicitValue) ||
    normalizeString(process.env.AI_SUMMARY_AGENT_SURFACE) ||
    normalizeString(process.env.COMPOUNDING_AGENT_SURFACE) ||
    normalizeString(process.env.CODEX_AGENT_SURFACE) ||
    "repo_cli"
  );
}

function extractTaskIdFromArgv(argv = []) {
  for (const arg of argv) {
    if (arg === "--") continue;
    if (arg.startsWith("--taskId=")) return normalizeString(arg.split("=")[1]);
    if (arg.startsWith("--task-id=")) return normalizeString(arg.split("=")[1]);
  }
  return "";
}

function safeParseJson(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function withinRetention(timestamp, now = Date.now(), retentionDays = RETENTION_DAYS) {
  const epoch = Date.parse(normalizeString(timestamp));
  if (!Number.isFinite(epoch)) return true;
  return now - epoch <= retentionDays * DAY_MS;
}

function normalizeGainEvent(event = {}) {
  return {
    schema_version: normalizeString(event.schema_version, SCHEMA_VERSION),
    profile_version: normalizeString(event.profile_version, "1"),
    timestamp: normalizeString(event.timestamp, new Date().toISOString()),
    task_id: normalizeString(event.task_id) || null,
    shortcut_id: normalizeString(event.shortcut_id) || null,
    agent_surface: resolveAgentSurface(event.agent_surface),
    original_cmd: normalizeString(event.original_cmd),
    input_tokens_est: Math.max(0, Math.round(toNumber(event.input_tokens_est))),
    output_tokens_est: Math.max(0, Math.round(toNumber(event.output_tokens_est))),
    saved_tokens_est: Math.max(0, Math.round(toNumber(event.saved_tokens_est))),
    savings_pct_est: clampPercent(event.savings_pct_est),
    exec_time_ms: Math.max(0, Math.round(toNumber(event.exec_time_ms))),
    exit_code: Math.round(toNumber(event.exit_code, 0)),
    was_fallback: Boolean(event.was_fallback),
    filter_error: normalizeString(event.filter_error) || null,
    raw_bytes: Math.max(0, Math.round(toNumber(event.raw_bytes))),
    compact_bytes: Math.max(0, Math.round(toNumber(event.compact_bytes))),
    tee_path: normalizeString(event.tee_path) || null,
    event_kind: normalizeString(event.event_kind, "summary_run"),
    adopted: typeof event.adopted === "boolean" ? event.adopted : null,
    profile_id: normalizeString(event.profile_id) || null,
  };
}

function readCommandGainEvents(root = process.cwd()) {
  const eventsPath = getEventsPath(root);
  if (!fs.existsSync(eventsPath)) return [];
  return fs
    .readFileSync(eventsPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(safeParseJson)
    .filter(Boolean);
}

function writeCommandGainEvents(root = process.cwd(), events = []) {
  const eventsPath = getEventsPath(root);
  ensureDirectory(eventsPath);
  const content = events.map((event) => JSON.stringify(event)).join("\n");
  fs.writeFileSync(eventsPath, content ? `${content}\n` : "", "utf8");
  return eventsPath;
}

function appendCommandGainEvent(root = process.cwd(), event = {}) {
  const now = Date.now();
  const retained = readCommandGainEvents(root)
    .filter((entry) => withinRetention(entry.timestamp, now))
    .map(normalizeGainEvent);
  retained.push(normalizeGainEvent(event));
  return writeCommandGainEvents(root, retained);
}

function recordShortcutOpportunity(root = process.cwd(), payload = {}) {
  if (process.env.COMPOUNDING_SUMMARY_DISABLE_TRACKING === "1") {
    return null;
  }

  const shortcutId = normalizeString(payload.shortcutId);
  const originalCmd = normalizeString(payload.originalCmd);
  if (!shortcutId || !originalCmd) {
    return null;
  }

  return appendCommandGainEvent(root, {
    event_kind: "shortcut_opportunity",
    profile_id: normalizeString(payload.profileId) || null,
    profile_version: normalizeString(payload.profileVersion, "1"),
    task_id: normalizeString(payload.taskId) || extractTaskIdFromArgv(process.argv.slice(2)) || null,
    shortcut_id: shortcutId,
    agent_surface: resolveAgentSurface(payload.agentSurface),
    original_cmd: originalCmd,
    input_tokens_est: 0,
    output_tokens_est: 0,
    saved_tokens_est: 0,
    savings_pct_est: 0,
    exec_time_ms: 0,
    exit_code: Math.round(toNumber(payload.exitCode, 0)),
    was_fallback: false,
    filter_error: null,
    raw_bytes: 0,
    compact_bytes: 0,
    tee_path: null,
    adopted: Boolean(payload.adopted),
  });
}

function recordShortcutOpportunityFromEnv(root = process.cwd(), defaults = {}) {
  const shortcutId = normalizeString(process.env.COMPOUNDING_SUMMARY_SHORTCUT_ID, normalizeString(defaults.shortcutId));
  const originalCmd = normalizeString(process.env.COMPOUNDING_SUMMARY_ORIGINAL_CMD, normalizeString(defaults.originalCmd));
  if (!shortcutId || !originalCmd) return null;
  return recordShortcutOpportunity(root, {
    shortcutId,
    originalCmd,
    adopted: process.env.COMPOUNDING_SUMMARY_ADOPTED === "1",
    agentSurface: process.env.COMPOUNDING_AGENT_SURFACE || defaults.agentSurface,
    taskId: defaults.taskId,
    profileId: defaults.profileId,
    profileVersion: defaults.profileVersion,
    exitCode: defaults.exitCode,
  });
}

const formatTokens = formatEstimatedTokens;

function aggregateByPeriod(events, getKey) {
  const buckets = new Map();
  for (const event of events) {
    const key = getKey(event);
    if (!key) continue;
    const current = buckets.get(key) || {
      key,
      commands: 0,
      input_tokens_est: 0,
      output_tokens_est: 0,
      saved_tokens_est: 0,
      exec_time_ms: 0,
    };
    current.commands += 1;
    current.input_tokens_est += Math.max(0, toNumber(event.input_tokens_est));
    current.output_tokens_est += Math.max(0, toNumber(event.output_tokens_est));
    current.saved_tokens_est += Math.max(0, toNumber(event.saved_tokens_est));
    current.exec_time_ms += Math.max(0, toNumber(event.exec_time_ms));
    buckets.set(key, current);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((bucket) => ({
      ...bucket,
      savings_pct_est: bucket.input_tokens_est > 0 ? Number(((bucket.saved_tokens_est / bucket.input_tokens_est) * 100).toFixed(2)) : 0,
    }));
}

function toIsoDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toIsoWeek(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function toIsoMonth(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 7);
}

function buildShortcutStats(events) {
  const summaryEvents = events.filter((event) => event.event_kind === "summary_run" && normalizeString(event.shortcut_id));
  const opportunityEvents = events.filter((event) => event.event_kind === "shortcut_opportunity" && normalizeString(event.shortcut_id));
  const shortcutIds = new Set([
    ...summaryEvents.map((event) => normalizeString(event.shortcut_id)),
    ...opportunityEvents.map((event) => normalizeString(event.shortcut_id)),
  ]);

  return Array.from(shortcutIds)
    .filter(Boolean)
    .sort()
    .map((shortcutId) => {
      const relatedSummary = summaryEvents.filter((event) => normalizeString(event.shortcut_id) === shortcutId);
      const relatedOpportunities = opportunityEvents.filter((event) => normalizeString(event.shortcut_id) === shortcutId);
      const savedTokens = relatedSummary.reduce((sum, event) => sum + Math.max(0, toNumber(event.saved_tokens_est)), 0);
      const usageCount = relatedSummary.length;

      if (TRUE_DENOMINATOR_SHORTCUTS.has(shortcutId)) {
        const opportunityCount = relatedOpportunities.length;
        const adoptedCount = relatedOpportunities.filter((event) => event.adopted === true).length;
        return {
          shortcut_id: shortcutId,
          mode: "deterministic",
          opportunity_count: opportunityCount,
          adopted_count: adoptedCount,
          adoption_pct: opportunityCount > 0 ? Number(((adoptedCount / opportunityCount) * 100).toFixed(2)) : 0,
          usage_count: usageCount,
          saved_tokens_est: savedTokens,
        };
      }

      return {
        shortcut_id: shortcutId,
        mode: "usage_only",
        usage_count: usageCount,
        saved_tokens_est: savedTokens,
      };
    });
}

function buildProfileStats(events) {
  const summaryEvents = events.filter((event) => event.event_kind === "summary_run" && normalizeString(event.profile_id));
  const profiles = new Map();
  for (const event of summaryEvents) {
    const profileId = normalizeString(event.profile_id);
    const current = profiles.get(profileId) || {
      profile_id: profileId,
      runs: 0,
      input_tokens_est: 0,
      output_tokens_est: 0,
      saved_tokens_est: 0,
    };
    current.runs += 1;
    current.input_tokens_est += Math.max(0, toNumber(event.input_tokens_est));
    current.output_tokens_est += Math.max(0, toNumber(event.output_tokens_est));
    current.saved_tokens_est += Math.max(0, toNumber(event.saved_tokens_est));
    profiles.set(profileId, current);
  }

  return Array.from(profiles.values())
    .sort((a, b) => a.profile_id.localeCompare(b.profile_id))
    .map((profile) => ({
      ...profile,
      savings_pct_est: profile.input_tokens_est > 0 ? Number(((profile.saved_tokens_est / profile.input_tokens_est) * 100).toFixed(2)) : 0,
    }));
}

function buildCommandGainReport(root = process.cwd(), options = {}) {
  const requestedDays = Math.max(1, Math.round(toNumber(options.days, RETENTION_DAYS)));
  const now = Date.now();
  const lowerBound = now - requestedDays * DAY_MS;
  const events = readCommandGainEvents(root)
    .map(normalizeGainEvent)
    .filter((event) => withinRetention(event.timestamp, now))
    .filter((event) => {
      const epoch = Date.parse(event.timestamp);
      if (!Number.isFinite(epoch)) return true;
      return epoch >= lowerBound;
    });

  const summaryEvents = events.filter((event) => event.event_kind === "summary_run");
  const totalInput = summaryEvents.reduce((sum, event) => sum + Math.max(0, toNumber(event.input_tokens_est)), 0);
  const totalOutput = summaryEvents.reduce((sum, event) => sum + Math.max(0, toNumber(event.output_tokens_est)), 0);
  const totalSaved = summaryEvents.reduce((sum, event) => sum + Math.max(0, toNumber(event.saved_tokens_est)), 0);
  const fallbackCount = summaryEvents.filter((event) => event.was_fallback).length;
  const dashboard = buildAiEfficiencyDashboard(events, { supportedProfiles: AI_EFFICIENCY_SUPPORTED_PROFILES });

  return {
    ok: true,
    schema_version: SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    retention_days: RETENTION_DAYS,
    report_window_days: requestedDays,
    events_path: getEventsPath(root),
    totals: {
      summary_runs: summaryEvents.length,
      total_input_tokens_est: totalInput,
      total_output_tokens_est: totalOutput,
      total_saved_tokens_est: totalSaved,
      avg_savings_pct_est: totalInput > 0 ? Number(((totalSaved / totalInput) * 100).toFixed(2)) : 0,
      fallback_count: fallbackCount,
    },
    by_day: aggregateByPeriod(summaryEvents, (event) => toIsoDay(event.timestamp)),
    by_week: aggregateByPeriod(summaryEvents, (event) => toIsoWeek(event.timestamp)),
    by_month: aggregateByPeriod(summaryEvents, (event) => toIsoMonth(event.timestamp)),
    by_profile: buildProfileStats(events),
    shortcut_adoption: buildShortcutStats(events),
    coverage: dashboard.coverage,
    trend_delta: dashboard.trend_delta,
    task_rollups: dashboard.task_rollups,
    dashboard,
  };
}

function formatPeriodRows(label, rows, formatter = (row) => row.key) {
  if (!rows.length) return [`${label}: none`];
  return [
    `${label}:`,
    ...rows.map(
      (row) =>
        `- ${formatter(row)}: ${row.commands} runs, saved ~${formatTokens(row.saved_tokens_est)} tokens, ${row.savings_pct_est}%`
    ),
  ];
}

function formatCommandGainReportText(report) {
  const lines = [
    `Command Gain (${report.report_window_days}d)`,
    `- summary runs: ${report.totals.summary_runs}`,
    `- estimated saved: ~${formatTokens(report.totals.total_saved_tokens_est)} tokens`,
    `- average savings: ${report.totals.avg_savings_pct_est}%`,
    `- fallbacks: ${report.totals.fallback_count}`,
  ];

  if (report.by_profile.length) {
    lines.push("- profiles:");
    for (const profile of report.by_profile) {
      lines.push(`  - ${profile.profile_id}: ${profile.runs} runs, ~${formatTokens(profile.saved_tokens_est)} saved, ${profile.savings_pct_est}%`);
    }
  }

  if (report.shortcut_adoption.length) {
    lines.push("- shortcut adoption:");
    for (const shortcut of report.shortcut_adoption) {
      if (shortcut.mode === "deterministic") {
        lines.push(
          `  - ${shortcut.shortcut_id}: ${shortcut.adopted_count}/${shortcut.opportunity_count} adopted (${shortcut.adoption_pct}%), ~${formatTokens(shortcut.saved_tokens_est)} saved`
        );
      } else {
        lines.push(`  - ${shortcut.shortcut_id}: ${shortcut.usage_count} uses, ~${formatTokens(shortcut.saved_tokens_est)} saved`);
      }
    }
  }

  if (report.dashboard?.adoption?.alerts?.length) {
    lines.push("- adoption alerts:");
    for (const alert of report.dashboard.adoption.alerts) {
      lines.push(
        `  - ${alert.shortcut_id}: adoption ${alert.adoption_pct}%, missed ~${formatTokens(alert.missed_savings_est)} tokens across ${alert.opportunity_count} opportunities`
      );
    }
  }

  if (report.coverage?.never_used_profiles?.length) {
    lines.push("- never used wrappers:");
    for (const profileId of report.coverage.never_used_profiles.slice(0, 6)) {
      lines.push(`  - ${profileId}`);
    }
  }

  if (report.task_rollups?.length) {
    lines.push("- top task rollups:");
    for (const task of report.task_rollups.slice(0, 5)) {
      lines.push(
        `  - ${task.task_id}: ${task.summary_runs} runs, ~${formatTokens(task.saved_tokens_est)} saved, avg ${task.avg_savings_pct_est}%`
      );
    }
  }

  lines.push(...formatPeriodRows("daily", report.by_day.slice(-7)));
  lines.push(...formatPeriodRows("weekly", report.by_week.slice(-4)));
  lines.push(...formatPeriodRows("monthly", report.by_month.slice(-3)));
  lines.push("- notes: token values are estimated from byte size and only用于趋势与 ROI。");
  return lines.join("\n");
}

module.exports = {
  EVENTS_RELATIVE_PATH,
  RETENTION_DAYS,
  appendCommandGainEvent,
  buildCommandGainReport,
  byteLength,
  estimateTokens,
  extractTaskIdFromArgv,
  formatCommandGainReportText,
  getEventsPath,
  normalizeGainEvent,
  readCommandGainEvents,
  recordShortcutOpportunity,
  recordShortcutOpportunityFromEnv,
  resolveAgentSurface,
};
