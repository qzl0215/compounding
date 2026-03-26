export type TaskCostCodeSource = "live" | "snapshot" | "none";

export type TaskCostTime = {
  active_ms: number;
  wait_ms: number;
  total_ms: number;
  dominant_stage: string | null;
  repeated_blockers: number;
  latest_blockers: string[];
};

export type TaskCostTokens = {
  summary_runs: number;
  context_packets: number;
  summary_input_est: number;
  summary_output_est: number;
  summary_saved_est: number;
  context_input_est: number;
  context_output_est: number;
  context_saved_est: number;
};

export type TaskCostCode = {
  source: TaskCostCodeSource;
  files: number;
  insertions: number;
  deletions: number;
};

export type TaskCostEffect = {
  last_gate_failures: string[];
  release_state: string;
  build_result: string | null;
  smoke_result: string | null;
  acceptance_status: string | null;
  blockers: string[];
  status_summary: string;
};

export type TaskCostLedger = {
  schema_version: string;
  updated_at: string | null;
  task_id: string;
  title: string;
  delivery_status: string;
  version_label: string | null;
  time: TaskCostTime;
  tokens: TaskCostTokens;
  code: TaskCostCode;
  effect: TaskCostEffect;
};

export type TaskCostSnapshot = Pick<TaskCostLedger, "time" | "tokens" | "code" | "effect">;

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeString(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim() || fallback;
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => normalizeString(value)).filter(Boolean)));
}

export function createEmptyTaskCostLedger(taskId = "", title = "", deliveryStatus = "not_started"): TaskCostLedger {
  return {
    schema_version: "1",
    updated_at: null,
    task_id: normalizeString(taskId),
    title: normalizeString(title),
    delivery_status: normalizeString(deliveryStatus, "not_started"),
    version_label: null,
    time: {
      active_ms: 0,
      wait_ms: 0,
      total_ms: 0,
      dominant_stage: null,
      repeated_blockers: 0,
      latest_blockers: [],
    },
    tokens: {
      summary_runs: 0,
      context_packets: 0,
      summary_input_est: 0,
      summary_output_est: 0,
      summary_saved_est: 0,
      context_input_est: 0,
      context_output_est: 0,
      context_saved_est: 0,
    },
    code: {
      source: "none",
      files: 0,
      insertions: 0,
      deletions: 0,
    },
    effect: {
      last_gate_failures: [],
      release_state: normalizeString(deliveryStatus, "not_started"),
      build_result: null,
      smoke_result: null,
      acceptance_status: null,
      blockers: [],
      status_summary: "当前还没有可用的成本账单。",
    },
  };
}

export function normalizeTaskCostSnapshot(input: Partial<TaskCostSnapshot> | null | undefined): TaskCostSnapshot | null {
  if (!input) return null;
  const time = input.time
    ? {
        active_ms: Math.max(0, Math.round(toNumber(input.time.active_ms))),
        wait_ms: Math.max(0, Math.round(toNumber(input.time.wait_ms))),
        total_ms: Math.max(0, Math.round(toNumber(input.time.total_ms))),
        dominant_stage: normalizeString(input.time.dominant_stage) || null,
        repeated_blockers: Math.max(0, Math.round(toNumber(input.time.repeated_blockers))),
        latest_blockers: uniqueStrings(Array.isArray(input.time.latest_blockers) ? input.time.latest_blockers : []),
      }
    : createEmptyTaskCostLedger().time;

  const tokens = input.tokens
    ? {
        summary_runs: Math.max(0, Math.round(toNumber(input.tokens.summary_runs))),
        context_packets: Math.max(0, Math.round(toNumber(input.tokens.context_packets))),
        summary_input_est: Math.max(0, Math.round(toNumber(input.tokens.summary_input_est))),
        summary_output_est: Math.max(0, Math.round(toNumber(input.tokens.summary_output_est))),
        summary_saved_est: Math.max(0, Math.round(toNumber(input.tokens.summary_saved_est))),
        context_input_est: Math.max(0, Math.round(toNumber(input.tokens.context_input_est))),
        context_output_est: Math.max(0, Math.round(toNumber(input.tokens.context_output_est))),
        context_saved_est: Math.max(0, Math.round(toNumber(input.tokens.context_saved_est))),
      }
    : createEmptyTaskCostLedger().tokens;

  const code = input.code
    ? {
        source: normalizeTaskCostCodeSource(input.code.source),
        files: Math.max(0, Math.round(toNumber(input.code.files))),
        insertions: Math.max(0, Math.round(toNumber(input.code.insertions))),
        deletions: Math.max(0, Math.round(toNumber(input.code.deletions))),
      }
    : createEmptyTaskCostLedger().code;

  const effect = input.effect
    ? {
        last_gate_failures: uniqueStrings(Array.isArray(input.effect.last_gate_failures) ? input.effect.last_gate_failures : []),
        release_state: normalizeString(input.effect.release_state, "not_started"),
        build_result: normalizeString(input.effect.build_result) || null,
        smoke_result: normalizeString(input.effect.smoke_result) || null,
        acceptance_status: normalizeString(input.effect.acceptance_status) || null,
        blockers: uniqueStrings(Array.isArray(input.effect.blockers) ? input.effect.blockers : []),
        status_summary: normalizeString(input.effect.status_summary) || "当前还没有可用的成本账单。",
      }
    : createEmptyTaskCostLedger().effect;

  return { time, tokens, code, effect };
}

export function toTaskCostSnapshot(ledger: TaskCostLedger | null | undefined): TaskCostSnapshot | null {
  if (!ledger) return null;
  return normalizeTaskCostSnapshot({
    time: ledger.time,
    tokens: ledger.tokens,
    code: ledger.code,
    effect: ledger.effect,
  });
}

export function normalizeTaskCostCodeSource(value: unknown): TaskCostCodeSource {
  const normalized = normalizeString(value);
  if (normalized === "live" || normalized === "snapshot") return normalized;
  return "none";
}

export function formatTaskCostDuration(value: number) {
  const duration = Math.max(0, Math.round(toNumber(value)));
  if (duration === 0) return "0m";
  const minutes = duration / 60000;
  if (minutes >= 60) {
    return `${(minutes / 60).toFixed(minutes >= 100 ? 0 : 1)}h`;
  }
  if (minutes >= 1) {
    return `${minutes >= 10 ? Math.round(minutes) : Math.round(minutes * 10) / 10}m`;
  }
  return `${Math.max(1, Math.round(duration / 1000))}s`;
}

export function formatTaskCostCodeDelta(code: Pick<TaskCostCode, "files" | "insertions" | "deletions">) {
  const files = Math.max(0, Math.round(toNumber(code.files)));
  const insertions = Math.max(0, Math.round(toNumber(code.insertions)));
  const deletions = Math.max(0, Math.round(toNumber(code.deletions)));
  return `${files} files, +${insertions}/-${deletions}`;
}

export function summarizeTaskCostEffect(effect: TaskCostEffect) {
  if (effect.status_summary) return effect.status_summary;
  if (effect.last_gate_failures.length > 0) {
    return `最近 gate 失败：${effect.last_gate_failures[0]}`;
  }
  if (effect.blockers.length > 0) {
    return `当前仍受 ${effect.blockers[0]} 阻塞。`;
  }
  return "当前没有明显的工程阻塞。";
}

export function taskCostTotalInputTokens(ledger: TaskCostLedger) {
  return ledger.tokens.summary_input_est + ledger.tokens.context_input_est;
}

export function taskCostTotalSavedTokens(ledger: TaskCostLedger) {
  return ledger.tokens.summary_saved_est + ledger.tokens.context_saved_est;
}

export function taskCostIntensityScore(ledger: TaskCostLedger) {
  return ledger.time.total_ms * 10 + taskCostTotalInputTokens(ledger);
}
