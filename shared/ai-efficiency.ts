import { createRequire } from "node:module";
import type { TaskCostLedger } from "./task-cost";

const require = createRequire(import.meta.url);
const { taskCostIntensityScore } = require("./task-cost.ts");

export type AiEfficiencyEventKind = "summary_run" | "shortcut_opportunity" | "context_packet";

export const AI_EFFICIENCY_SUPPORTED_PROFILES = [
  "preflight_summary",
  "validate_static_summary",
  "validate_build_summary",
  "review_summary",
  "preview_summary",
  "prod_summary",
  "diff_summary",
  "tree_summary",
  "find_summary",
  "read_summary",
] as const;

export type AiSummaryFirstWorkflow = {
  summary_first_commands: string[];
  raw_fallback_commands: string[];
};

export type AiSummaryFirstWorkflowOptions = {
  taskId?: string | null;
  querySeed?: string | null;
  readPath?: string | null;
};

export type AiSummaryShortcutOptions = AiSummaryFirstWorkflowOptions;

export type AiEfficiencyEvent = {
  schema_version: string;
  profile_version: string;
  timestamp: string;
  task_id: string | null;
  shortcut_id: string | null;
  agent_surface: string;
  original_cmd: string;
  input_tokens_est: number;
  output_tokens_est: number;
  saved_tokens_est: number;
  savings_pct_est: number;
  exec_time_ms: number;
  exit_code: number;
  was_fallback: boolean;
  filter_error: string | null;
  raw_bytes: number;
  compact_bytes: number;
  tee_path: string | null;
  event_kind: AiEfficiencyEventKind;
  adopted: boolean | null;
  profile_id: string | null;
};

export type AiEfficiencyDashboard = {
  overview: {
    summary_runs: number;
    context_packets: number;
    total_input_tokens_est: number;
    total_output_tokens_est: number;
    total_saved_tokens_est: number;
    avg_savings_pct_est: number;
    fallback_count: number;
    tee_count: number;
    filter_error_count: number;
  };
  consumption: {
    top_profiles_by_input: Array<{ profile_id: string; runs: number; input_tokens_est: number; output_tokens_est: number }>;
    top_commands_by_input: Array<{ original_cmd: string; runs: number; input_tokens_est: number }>;
    recent_daily_input: Array<{ key: string; input_tokens_est: number; output_tokens_est: number; saved_tokens_est: number }>;
  };
  savings: {
    top_profiles_by_saved: Array<{ profile_id: string; runs: number; saved_tokens_est: number; savings_pct_est: number }>;
    top_commands_by_saved: Array<{ original_cmd: string; runs: number; saved_tokens_est: number }>;
    recent_daily_saved: Array<{ key: string; saved_tokens_est: number; savings_pct_est: number }>;
  };
  adoption: {
    deterministic_shortcuts: Array<{
      shortcut_id: string;
      opportunity_count: number;
      adopted_count: number;
      adoption_pct: number;
      usage_count: number;
      saved_tokens_est: number;
      missed_savings_est: number;
    }>;
    usage_shortcuts: Array<{ shortcut_id: string; usage_count: number; saved_tokens_est: number }>;
    alerts: Array<{ shortcut_id: string; adoption_pct: number; missed_savings_est: number; opportunity_count: number }>;
  };
  coverage: {
    supported_profiles: string[];
    observed_profiles: string[];
    never_used_profiles: string[];
  };
  trend_delta: {
    last_7d_input: number;
    prev_7d_input: number;
    last_7d_saved: number;
    prev_7d_saved: number;
    last_7d_adoption: number;
    prev_7d_adoption: number;
  };
  task_rollups: Array<{
    task_id: string;
    summary_runs: number;
    input_tokens_est: number;
    saved_tokens_est: number;
    avg_savings_pct_est: number;
  }>;
  task_costs: TaskCostLedger[];
  context_waste: {
    top_time_loss_patterns: Array<{
      signature: string;
      task_count: number;
      lost_time_ms: number;
      why_time_was_lost: string;
      next_agent_should_do_instead: string;
      which_summary_shortcut_to_use: string | null;
    }>;
    top_missed_shortcuts: Array<{
      shortcut_id: string;
      missed_count: number;
      task_count: number;
      missed_savings_est: number;
      which_summary_shortcut_to_use: string | null;
    }>;
    promotion_candidates: Array<{
      candidate_id: string;
      label: string;
      reason: string;
      evidence: string;
    }>;
  };
  context_density: {
    total_packets: number;
    balanced_runs: number;
    expanded_runs: number;
    balanced_pct: number;
    total_input_tokens_est: number;
    total_output_tokens_est: number;
    total_saved_tokens_est: number;
    top_context_heavy_tasks: Array<{
      task_id: string;
      runs: number;
      input_tokens_est: number;
      saved_tokens_est: number;
    }>;
  };
  health: {
    raw_trace_rate_pct: number;
    nonzero_exit_raw_trace_rate_pct: number;
    fallback_count: number;
    tee_count: number;
    filter_error_count: number;
  };
};

const TRUE_DENOMINATOR_SHORTCUTS = new Set(["preflight_summary", "review_summary", "preview_summary", "prod_summary"]);

function normalizeString(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value: unknown) {
  const parsed = toNumber(value, 0);
  if (parsed < 0) return 0;
  if (parsed > 100) return 100;
  return Number(parsed.toFixed(2));
}

function roundInt(value: unknown) {
  return Math.max(0, Math.round(toNumber(value, 0)));
}

function toIsoDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function parseEpoch(value: string) {
  const epoch = Date.parse(value);
  return Number.isFinite(epoch) ? epoch : null;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => normalizeString(value)).filter(Boolean)));
}

function sumCommandBuckets(
  events: AiEfficiencyEvent[],
  keyFn: (event: AiEfficiencyEvent) => string,
) {
  return aggregateRows(
    events,
    keyFn,
    () => ({ runs: 0, input_tokens_est: 0, output_tokens_est: 0, saved_tokens_est: 0 }),
    (bucket, event) => {
      bucket.runs += 1;
      bucket.input_tokens_est += event.input_tokens_est;
      bucket.output_tokens_est += event.output_tokens_est;
      bucket.saved_tokens_est += event.saved_tokens_est;
    },
  );
}

function aggregateRows<T extends { [key: string]: unknown }>(
  events: AiEfficiencyEvent[],
  keyFn: (event: AiEfficiencyEvent) => string,
  seed: () => T,
  consume: (bucket: T, event: AiEfficiencyEvent) => void,
) {
  const buckets = new Map<string, T>();
  for (const event of events) {
    const key = keyFn(event);
    if (!key) continue;
    const bucket = buckets.get(key) || seed();
    consume(bucket, event);
    buckets.set(key, bucket);
  }
  return Array.from(buckets.entries()).map(([key, bucket]) => ({ key, ...bucket })) as Array<T & { key: string }>;
}

export function normalizeAiEfficiencyEvent(event: Record<string, unknown> = {}): AiEfficiencyEvent {
  const eventKind = normalizeString(event.event_kind, "summary_run");
  return {
    schema_version: normalizeString(event.schema_version, "1"),
    profile_version: normalizeString(event.profile_version, "1"),
    timestamp: normalizeString(event.timestamp, new Date().toISOString()),
    task_id: normalizeString(event.task_id) || null,
    shortcut_id: normalizeString(event.shortcut_id) || null,
    agent_surface: normalizeString(event.agent_surface, "repo_cli"),
    original_cmd: normalizeString(event.original_cmd),
    input_tokens_est: roundInt(event.input_tokens_est),
    output_tokens_est: roundInt(event.output_tokens_est),
    saved_tokens_est: roundInt(event.saved_tokens_est),
    savings_pct_est: clampPercent(event.savings_pct_est),
    exec_time_ms: roundInt(event.exec_time_ms),
    exit_code: Math.round(toNumber(event.exit_code, 0)),
    was_fallback: Boolean(event.was_fallback),
    filter_error: normalizeString(event.filter_error) || null,
    raw_bytes: roundInt(event.raw_bytes),
    compact_bytes: roundInt(event.compact_bytes),
    tee_path: normalizeString(event.tee_path) || null,
    event_kind:
      eventKind === "shortcut_opportunity" || eventKind === "context_packet"
        ? eventKind
        : "summary_run",
    adopted: typeof event.adopted === "boolean" ? event.adopted : null,
    profile_id: normalizeString(event.profile_id) || null,
  };
}

export function buildSummaryShortcutCommand(shortcutId: string, options: AiSummaryShortcutOptions = {}) {
  const taskId = normalizeString(options.taskId);
  const querySeed = normalizeString(options.querySeed) || "keyword";
  const readPath = normalizeString(options.readPath) || "memory/project/current-state.md";
  const normalized = normalizeString(shortcutId);

  switch (normalized) {
    case "preflight_summary":
      return taskId ? `pnpm ai:preflight:summary -- --taskId=${taskId}` : "pnpm ai:preflight:summary";
    case "validate_static_summary":
      return "pnpm ai:validate:static:summary";
    case "validate_build_summary":
      return "pnpm ai:validate:build:summary";
    case "review_summary":
      return taskId ? `pnpm ai:review:summary -- --taskId=${taskId}` : "pnpm ai:review:summary";
    case "preview_summary":
      return "pnpm ai:preview:summary";
    case "prod_summary":
      return "pnpm ai:prod:summary";
    case "diff_summary":
      return "pnpm ai:diff:summary";
    case "tree_summary":
      return "pnpm ai:tree:summary";
    case "find_summary":
      return `pnpm ai:find:summary -- --query=${querySeed}`;
    case "read_summary":
      return `pnpm ai:read:summary -- --path=${readPath}`;
    default:
      return "";
  }
}

export function buildSummaryFirstWorkflow(options: AiSummaryFirstWorkflowOptions = {}): AiSummaryFirstWorkflow {
  return {
    summary_first_commands: [
      buildSummaryShortcutCommand("preflight_summary", options),
      buildSummaryShortcutCommand("diff_summary", options),
      buildSummaryShortcutCommand("tree_summary", options),
      buildSummaryShortcutCommand("find_summary", options),
      buildSummaryShortcutCommand("read_summary", options),
    ],
    raw_fallback_commands: [
      normalizeString(options.taskId) ? `pnpm preflight -- --taskId=${normalizeString(options.taskId)}` : "pnpm preflight",
      "git diff",
      "rg --files --hidden",
      `rg -n --hidden ${normalizeString(options.querySeed) || "keyword"}`,
      `sed -n '1,200p' ${normalizeString(options.readPath) || "memory/project/current-state.md"}`,
    ],
  };
}

export function buildAiEfficiencyDashboard(
  inputEvents: Array<Record<string, unknown>>,
  options: {
    supportedProfiles?: readonly string[];
    taskCostLedgers?: TaskCostLedger[];
    contextRetroReport?: {
      top_time_loss_patterns?: AiEfficiencyDashboard["context_waste"]["top_time_loss_patterns"];
      top_missed_shortcuts?: AiEfficiencyDashboard["context_waste"]["top_missed_shortcuts"];
      promotion_candidates?: AiEfficiencyDashboard["context_waste"]["promotion_candidates"];
    } | null;
  } = {},
): AiEfficiencyDashboard {
  const events = inputEvents.map(normalizeAiEfficiencyEvent);
  const summaryEvents = events.filter((event) => event.event_kind === "summary_run");
  const opportunityEvents = events.filter((event) => event.event_kind === "shortcut_opportunity");
  const contextEvents = events.filter((event) => event.event_kind === "context_packet");
  const supportedProfiles = uniqueStrings([...(options.supportedProfiles || AI_EFFICIENCY_SUPPORTED_PROFILES)]);

  const totalInput = summaryEvents.reduce((sum, event) => sum + event.input_tokens_est, 0);
  const totalOutput = summaryEvents.reduce((sum, event) => sum + event.output_tokens_est, 0);
  const totalSaved = summaryEvents.reduce((sum, event) => sum + event.saved_tokens_est, 0);
  const fallbackCount = summaryEvents.filter((event) => event.was_fallback).length;
  const teeCount = summaryEvents.filter((event) => Boolean(event.tee_path)).length;
  const filterErrorCount = summaryEvents.filter((event) => Boolean(event.filter_error)).length;

  const profileRows = aggregateRows(
    summaryEvents,
    (event) => event.profile_id || "",
    () => ({ runs: 0, input_tokens_est: 0, output_tokens_est: 0, saved_tokens_est: 0 }),
    (bucket, event) => {
      bucket.runs += 1;
      bucket.input_tokens_est += event.input_tokens_est;
      bucket.output_tokens_est += event.output_tokens_est;
      bucket.saved_tokens_est += event.saved_tokens_est;
    },
  ).map((row) => ({
    profile_id: row.key,
    runs: row.runs,
    input_tokens_est: row.input_tokens_est,
    output_tokens_est: row.output_tokens_est,
    saved_tokens_est: row.saved_tokens_est,
    savings_pct_est: row.input_tokens_est > 0 ? Number(((row.saved_tokens_est / row.input_tokens_est) * 100).toFixed(2)) : 0,
  }));

  const commandRows = aggregateRows(
    summaryEvents,
    (event) => event.original_cmd,
    () => ({ runs: 0, input_tokens_est: 0, saved_tokens_est: 0 }),
    (bucket, event) => {
      bucket.runs += 1;
      bucket.input_tokens_est += event.input_tokens_est;
      bucket.saved_tokens_est += event.saved_tokens_est;
    },
  ).map((row) => ({
    original_cmd: row.key,
    runs: row.runs,
    input_tokens_est: row.input_tokens_est,
    saved_tokens_est: row.saved_tokens_est,
  }));

  const dailyRows = aggregateRows(
    summaryEvents,
    (event) => toIsoDay(event.timestamp),
    () => ({ input_tokens_est: 0, output_tokens_est: 0, saved_tokens_est: 0 }),
    (bucket, event) => {
      bucket.input_tokens_est += event.input_tokens_est;
      bucket.output_tokens_est += event.output_tokens_est;
      bucket.saved_tokens_est += event.saved_tokens_est;
    },
  )
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((row) => ({
      ...row,
      savings_pct_est: row.input_tokens_est > 0 ? Number(((row.saved_tokens_est / row.input_tokens_est) * 100).toFixed(2)) : 0,
    }));

  const shortcutIds = new Set([
    ...summaryEvents.map((event) => event.shortcut_id || ""),
    ...opportunityEvents.map((event) => event.shortcut_id || ""),
  ]);
  const deterministicShortcuts = Array.from(shortcutIds)
    .filter((shortcutId) => shortcutId && TRUE_DENOMINATOR_SHORTCUTS.has(shortcutId))
    .sort()
    .map((shortcutId) => {
      const summaries = summaryEvents.filter((event) => event.shortcut_id === shortcutId);
      const opportunities = opportunityEvents.filter((event) => event.shortcut_id === shortcutId);
      const opportunityCount = opportunities.length;
      const adoptedCount = opportunities.filter((event) => event.adopted === true).length;
      const savedTokens = summaries.reduce((sum, event) => sum + event.saved_tokens_est, 0);
      const averageSaved = summaries.length > 0 ? savedTokens / summaries.length : 0;
      const missedSavings = Math.round(Math.max(0, opportunityCount - adoptedCount) * averageSaved);
      return {
        shortcut_id: shortcutId,
        opportunity_count: opportunityCount,
        adopted_count: adoptedCount,
        adoption_pct: opportunityCount > 0 ? Number(((adoptedCount / opportunityCount) * 100).toFixed(2)) : 0,
        usage_count: summaries.length,
        saved_tokens_est: savedTokens,
        missed_savings_est: missedSavings,
      };
    });

  const usageShortcuts = Array.from(shortcutIds)
    .filter((shortcutId) => shortcutId && !TRUE_DENOMINATOR_SHORTCUTS.has(shortcutId))
    .sort()
    .map((shortcutId) => {
      const summaries = summaryEvents.filter((event) => event.shortcut_id === shortcutId);
      return {
        shortcut_id: shortcutId,
        usage_count: summaries.length,
        saved_tokens_est: summaries.reduce((sum, event) => sum + event.saved_tokens_est, 0),
      };
    });

  const nonzeroSummary = summaryEvents.filter((event) => event.exit_code !== 0);
  const nonzeroWithRawTrace = nonzeroSummary.filter((event) => Boolean(event.tee_path)).length;
  const observedProfiles = uniqueStrings(summaryEvents.map((event) => event.profile_id || ""));
  const coverage = {
    supported_profiles: supportedProfiles,
    observed_profiles: observedProfiles,
    never_used_profiles: supportedProfiles.filter((profileId) => !observedProfiles.includes(profileId)),
  };
  const eventEpochs = summaryEvents
    .map((event) => parseEpoch(event.timestamp))
    .filter((value): value is number => typeof value === "number");
  const referenceNow = eventEpochs.length ? Math.max(...eventEpochs) + 1 : Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const sumWindow = (rows: AiEfficiencyEvent[], field: "input_tokens_est" | "saved_tokens_est", start: number, end: number) =>
    rows
      .filter((event) => {
        const epoch = parseEpoch(event.timestamp);
        return epoch !== null && epoch >= start && epoch < end;
      })
      .reduce((sum, event) => sum + event[field], 0);
  const adoptionWindow = (rows: AiEfficiencyEvent[], start: number, end: number) => {
    const scoped = rows.filter((event) => {
      const epoch = parseEpoch(event.timestamp);
      return (
        epoch !== null &&
        epoch >= start &&
        epoch < end &&
        Boolean(event.shortcut_id) &&
        TRUE_DENOMINATOR_SHORTCUTS.has(event.shortcut_id || "")
      );
    });
    const opportunityCount = scoped.length;
    const adoptedCount = scoped.filter((event) => event.adopted === true).length;
    return opportunityCount > 0 ? Number(((adoptedCount / opportunityCount) * 100).toFixed(2)) : 0;
  };
  const trend_delta = {
    last_7d_input: sumWindow(summaryEvents, "input_tokens_est", referenceNow - weekMs, referenceNow),
    prev_7d_input: sumWindow(summaryEvents, "input_tokens_est", referenceNow - 2 * weekMs, referenceNow - weekMs),
    last_7d_saved: sumWindow(summaryEvents, "saved_tokens_est", referenceNow - weekMs, referenceNow),
    prev_7d_saved: sumWindow(summaryEvents, "saved_tokens_est", referenceNow - 2 * weekMs, referenceNow - weekMs),
    last_7d_adoption: adoptionWindow(opportunityEvents, referenceNow - weekMs, referenceNow),
    prev_7d_adoption: adoptionWindow(opportunityEvents, referenceNow - 2 * weekMs, referenceNow - weekMs),
  };
  const task_rollups = aggregateRows(
    summaryEvents.filter((event) => Boolean(event.task_id)),
    (event) => event.task_id || "",
    () => ({ summary_runs: 0, input_tokens_est: 0, saved_tokens_est: 0 }),
    (bucket, event) => {
      bucket.summary_runs += 1;
      bucket.input_tokens_est += event.input_tokens_est;
      bucket.saved_tokens_est += event.saved_tokens_est;
    },
  )
    .map((row) => ({
      task_id: row.key,
      summary_runs: row.summary_runs,
      input_tokens_est: row.input_tokens_est,
      saved_tokens_est: row.saved_tokens_est,
      avg_savings_pct_est: row.input_tokens_est > 0 ? Number(((row.saved_tokens_est / row.input_tokens_est) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.input_tokens_est - a.input_tokens_est || a.task_id.localeCompare(b.task_id));

  const contextTaskRows = sumCommandBuckets(
    contextEvents.filter((event) => Boolean(event.task_id)),
    (event) => event.task_id || "",
  )
    .map((row) => ({
      task_id: row.key,
      runs: row.runs,
      input_tokens_est: row.input_tokens_est,
      saved_tokens_est: row.saved_tokens_est,
    }))
    .sort((a, b) => b.input_tokens_est - a.input_tokens_est || a.task_id.localeCompare(b.task_id));

  const balancedRuns = contextEvents.filter((event) => normalizeString(event.profile_id).endsWith("_balanced")).length;
  const expandedRuns = contextEvents.filter((event) => normalizeString(event.profile_id).endsWith("_expanded")).length;
  const contextInput = contextEvents.reduce((sum, event) => sum + event.input_tokens_est, 0);
  const contextOutput = contextEvents.reduce((sum, event) => sum + event.output_tokens_est, 0);
  const contextSaved = contextEvents.reduce((sum, event) => sum + event.saved_tokens_est, 0);
  const contextRetro = options.contextRetroReport || null;
  const taskCostLedgers = [...(options.taskCostLedgers || [])].sort(
    (left, right) => taskCostIntensityScore(right) - taskCostIntensityScore(left) || left.task_id.localeCompare(right.task_id),
  );

  return {
    overview: {
      summary_runs: summaryEvents.length,
      context_packets: contextEvents.length,
      total_input_tokens_est: totalInput,
      total_output_tokens_est: totalOutput,
      total_saved_tokens_est: totalSaved,
      avg_savings_pct_est: totalInput > 0 ? Number(((totalSaved / totalInput) * 100).toFixed(2)) : 0,
      fallback_count: fallbackCount,
      tee_count: teeCount,
      filter_error_count: filterErrorCount,
    },
    consumption: {
      top_profiles_by_input: profileRows.sort((a, b) => b.input_tokens_est - a.input_tokens_est).slice(0, 5),
      top_commands_by_input: commandRows.sort((a, b) => b.input_tokens_est - a.input_tokens_est).slice(0, 5),
      recent_daily_input: dailyRows.slice(-7),
    },
    savings: {
      top_profiles_by_saved: profileRows.sort((a, b) => b.saved_tokens_est - a.saved_tokens_est).slice(0, 5),
      top_commands_by_saved: commandRows.sort((a, b) => b.saved_tokens_est - a.saved_tokens_est).slice(0, 5),
      recent_daily_saved: dailyRows.slice(-7).map((row) => ({
        key: row.key,
        saved_tokens_est: row.saved_tokens_est,
        savings_pct_est: row.savings_pct_est,
      })),
    },
    adoption: {
      deterministic_shortcuts: deterministicShortcuts,
      usage_shortcuts: usageShortcuts,
      alerts: deterministicShortcuts
        .filter((shortcut) => shortcut.opportunity_count >= 3 && shortcut.adoption_pct < 50)
        .sort((a, b) => b.missed_savings_est - a.missed_savings_est)
        .slice(0, 3)
        .map((shortcut) => ({
          shortcut_id: shortcut.shortcut_id,
          adoption_pct: shortcut.adoption_pct,
          missed_savings_est: shortcut.missed_savings_est,
          opportunity_count: shortcut.opportunity_count,
        })),
    },
    coverage,
    trend_delta,
    task_rollups,
    task_costs: taskCostLedgers,
    context_waste: {
      top_time_loss_patterns: Array.isArray(contextRetro?.top_time_loss_patterns) ? contextRetro.top_time_loss_patterns : [],
      top_missed_shortcuts: Array.isArray(contextRetro?.top_missed_shortcuts) ? contextRetro.top_missed_shortcuts : [],
      promotion_candidates: Array.isArray(contextRetro?.promotion_candidates) ? contextRetro.promotion_candidates : [],
    },
    context_density: {
      total_packets: contextEvents.length,
      balanced_runs: balancedRuns,
      expanded_runs: expandedRuns,
      balanced_pct: contextEvents.length > 0 ? Number(((balancedRuns / contextEvents.length) * 100).toFixed(2)) : 0,
      total_input_tokens_est: contextInput,
      total_output_tokens_est: contextOutput,
      total_saved_tokens_est: contextSaved,
      top_context_heavy_tasks: contextTaskRows.slice(0, 5),
    },
    health: {
      raw_trace_rate_pct: summaryEvents.length > 0 ? Number(((teeCount / summaryEvents.length) * 100).toFixed(2)) : 0,
      nonzero_exit_raw_trace_rate_pct:
        nonzeroSummary.length > 0 ? Number(((nonzeroWithRawTrace / nonzeroSummary.length) * 100).toFixed(2)) : 0,
      fallback_count: fallbackCount,
      tee_count: teeCount,
      filter_error_count: filterErrorCount,
    },
  };
}
