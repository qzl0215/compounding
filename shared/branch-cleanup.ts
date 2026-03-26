export type BranchCleanupTrigger = "prod_accepted" | "legacy_merged";

export type BranchCleanupOverallState = "active" | "scheduled" | "deleted" | "failed" | "canceled";

export type BranchCleanupLocalState = "active" | "scheduled" | "deleted" | "failed" | "canceled";

export type BranchCleanupRemoteState = "not_configured" | "scheduled" | "deleted" | "failed" | "canceled";

export type BranchCleanupSideScope = "local" | "remote";

export type BranchCleanupAttempt = {
  attempted_at: string | null;
  scope: BranchCleanupSideScope;
  ok: boolean;
  action: string;
  error_code: string | null;
  message: string | null;
};

export type BranchCleanupLocalRecord = {
  state: BranchCleanupLocalState;
  branch_name: string | null;
  deleted_at: string | null;
  last_error: string | null;
  error_code: string | null;
};

export type BranchCleanupRemoteRecord = {
  state: BranchCleanupRemoteState;
  remote_name: string | null;
  remote_ref: string | null;
  deleted_at: string | null;
  last_error: string | null;
  error_code: string | null;
};

export type BranchCleanupRecord = {
  schema_version: string;
  trigger: BranchCleanupTrigger;
  eligible_at: string | null;
  scheduled_for: string | null;
  delay_hours: number;
  source_release_id: string | null;
  source_commit: string | null;
  overall_state: BranchCleanupOverallState;
  local: BranchCleanupLocalRecord;
  remote: BranchCleanupRemoteRecord;
  attempt_count: number;
  last_attempt_at: string | null;
  canceled_reason: string | null;
  attempts: BranchCleanupAttempt[];
};

export type TaskBranchCleanupView = {
  trigger: BranchCleanupTrigger | null;
  overallState: BranchCleanupOverallState | "none";
  localState: BranchCleanupLocalState | "none";
  remoteState: BranchCleanupRemoteState | "none";
  eligibleAt: string | null;
  scheduledFor: string | null;
  delayHours: number;
  sourceReleaseId: string | null;
  sourceCommit: string | null;
  localBranch: string | null;
  remoteName: string | null;
  remoteRef: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  canceledReason: string | null;
  lastError: string | null;
  errorCode: string | null;
  isOverdue: boolean;
  summary: string;
};

function normalizeString(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim() || fallback;
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function toInt(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}

function normalizeOverallState(value: unknown): BranchCleanupOverallState {
  const normalized = normalizeString(value);
  if (normalized === "active" || normalized === "scheduled" || normalized === "deleted" || normalized === "failed" || normalized === "canceled") {
    return normalized;
  }
  return "active";
}

function normalizeLocalState(value: unknown): BranchCleanupLocalState {
  const normalized = normalizeString(value);
  if (normalized === "active" || normalized === "scheduled" || normalized === "deleted" || normalized === "failed" || normalized === "canceled") {
    return normalized;
  }
  return "active";
}

function normalizeRemoteState(value: unknown): BranchCleanupRemoteState {
  const normalized = normalizeString(value);
  if (
    normalized === "not_configured" ||
    normalized === "scheduled" ||
    normalized === "deleted" ||
    normalized === "failed" ||
    normalized === "canceled"
  ) {
    return normalized;
  }
  return "not_configured";
}

function normalizeTrigger(value: unknown): BranchCleanupTrigger {
  return normalizeString(value) === "legacy_merged" ? "legacy_merged" : "prod_accepted";
}

export function createEmptyBranchCleanupRecord(branchName: string | null = null): BranchCleanupRecord {
  return {
    schema_version: "1",
    trigger: "prod_accepted",
    eligible_at: null,
    scheduled_for: null,
    delay_hours: 24,
    source_release_id: null,
    source_commit: null,
    overall_state: "active",
    local: {
      state: "active",
      branch_name: normalizeString(branchName) || null,
      deleted_at: null,
      last_error: null,
      error_code: null,
    },
    remote: {
      state: "not_configured",
      remote_name: null,
      remote_ref: null,
      deleted_at: null,
      last_error: null,
      error_code: null,
    },
    attempt_count: 0,
    last_attempt_at: null,
    canceled_reason: null,
    attempts: [],
  };
}

export function normalizeBranchCleanupRecord(input: Partial<BranchCleanupRecord> | null | undefined): BranchCleanupRecord | null {
  if (!input) return null;
  const fallback = createEmptyBranchCleanupRecord(input.local?.branch_name || null);
  return {
    schema_version: normalizeString(input.schema_version, "1"),
    trigger: normalizeTrigger(input.trigger),
    eligible_at: normalizeString(input.eligible_at) || null,
    scheduled_for: normalizeString(input.scheduled_for) || null,
    delay_hours: toInt(input.delay_hours, 24) || 24,
    source_release_id: normalizeString(input.source_release_id) || null,
    source_commit: normalizeString(input.source_commit) || null,
    overall_state: normalizeOverallState(input.overall_state),
    local: {
      state: normalizeLocalState(input.local?.state),
      branch_name: normalizeString(input.local?.branch_name || fallback.local.branch_name) || null,
      deleted_at: normalizeString(input.local?.deleted_at) || null,
      last_error: normalizeString(input.local?.last_error) || null,
      error_code: normalizeString(input.local?.error_code) || null,
    },
    remote: {
      state: normalizeRemoteState(input.remote?.state),
      remote_name: normalizeString(input.remote?.remote_name) || null,
      remote_ref: normalizeString(input.remote?.remote_ref) || null,
      deleted_at: normalizeString(input.remote?.deleted_at) || null,
      last_error: normalizeString(input.remote?.last_error) || null,
      error_code: normalizeString(input.remote?.error_code) || null,
    },
    attempt_count: toInt(input.attempt_count, 0),
    last_attempt_at: normalizeString(input.last_attempt_at) || null,
    canceled_reason: normalizeString(input.canceled_reason) || null,
    attempts: Array.isArray(input.attempts)
      ? input.attempts
          .map((attempt) => ({
            attempted_at: normalizeString(attempt?.attempted_at) || null,
            scope: normalizeString(attempt?.scope) === "remote" ? "remote" : "local",
            ok: Boolean(attempt?.ok),
            action: normalizeString(attempt?.action),
            error_code: normalizeString(attempt?.error_code) || null,
            message: normalizeString(attempt?.message) || null,
          }))
          .filter((attempt) => Boolean(attempt.attempted_at || attempt.action || attempt.message))
      : [],
  };
}

export function deriveBranchCleanupOverallState(
  localState: BranchCleanupLocalState,
  remoteState: BranchCleanupRemoteState,
): BranchCleanupOverallState {
  if (localState === "failed" || remoteState === "failed") return "failed";
  if (localState === "canceled" || remoteState === "canceled") return "canceled";
  if (localState === "deleted" && (remoteState === "deleted" || remoteState === "not_configured")) return "deleted";
  if (localState === "scheduled" || remoteState === "scheduled") return "scheduled";
  return "active";
}

export function branchCleanupIsOverdue(record: BranchCleanupRecord | null | undefined, now = Date.now()) {
  const normalized = normalizeBranchCleanupRecord(record);
  if (!normalized || normalized.overall_state !== "scheduled" || !normalized.scheduled_for) return false;
  const scheduledAt = Date.parse(normalized.scheduled_for);
  if (!Number.isFinite(scheduledAt)) return false;
  return scheduledAt <= now;
}

export function formatBranchCleanupStateLabel(value: BranchCleanupOverallState | BranchCleanupLocalState | BranchCleanupRemoteState | "none") {
  const normalized = normalizeString(value);
  if (normalized === "scheduled") return "等待回收";
  if (normalized === "deleted") return "已回收";
  if (normalized === "failed") return "回收失败";
  if (normalized === "canceled") return "已取消";
  if (normalized === "active") return "未进入回收";
  if (normalized === "not_configured") return "远端未启用";
  return "未记录";
}

export function summarizeBranchCleanup(record: BranchCleanupRecord | null | undefined, now = Date.now()) {
  const normalized = normalizeBranchCleanupRecord(record);
  if (!normalized) return "尚未建立分支回收记录。";
  const overdue = branchCleanupIsOverdue(normalized, now);

  if (normalized.overall_state === "deleted") {
    if (normalized.remote.state === "deleted") return "本地与远端分支都已回收。";
    if (normalized.remote.state === "not_configured") return "本地分支已回收，远端未启用。";
    return "分支回收已完成。";
  }

  if (normalized.overall_state === "failed") {
    return normalized.remote.last_error || normalized.local.last_error || "分支回收失败，需人工处理。";
  }

  if (normalized.overall_state === "canceled") {
    return normalized.canceled_reason ? `分支回收已取消：${normalized.canceled_reason}` : "分支回收已取消。";
  }

  if (normalized.overall_state === "scheduled") {
    const prefix = normalized.trigger === "legacy_merged" ? "历史分支待回收" : "等待 24h 自动回收";
    if (overdue) {
      return `${prefix}，当前已逾期。`;
    }
    if (normalized.remote.state === "not_configured") {
      return `${prefix}，仅本地自动删除。`;
    }
    return `${prefix}，到期后会同步处理远端。`;
  }

  if (normalized.remote.state === "not_configured") {
    return "分支回收尚未启用远端侧。";
  }

  return "分支仍处于活跃状态。";
}

export function buildTaskBranchCleanupView(record: BranchCleanupRecord | null | undefined, now = Date.now()): TaskBranchCleanupView | null {
  const normalized = normalizeBranchCleanupRecord(record);
  if (!normalized) return null;
  const isOverdue = branchCleanupIsOverdue(normalized, now);
  return {
    trigger: normalized.trigger,
    overallState: normalized.overall_state,
    localState: normalized.local.state,
    remoteState: normalized.remote.state,
    eligibleAt: normalized.eligible_at,
    scheduledFor: normalized.scheduled_for,
    delayHours: normalized.delay_hours,
    sourceReleaseId: normalized.source_release_id,
    sourceCommit: normalized.source_commit,
    localBranch: normalized.local.branch_name,
    remoteName: normalized.remote.remote_name,
    remoteRef: normalized.remote.remote_ref,
    attemptCount: normalized.attempt_count,
    lastAttemptAt: normalized.last_attempt_at,
    canceledReason: normalized.canceled_reason,
    lastError: normalized.remote.last_error || normalized.local.last_error,
    errorCode: normalized.remote.error_code || normalized.local.error_code,
    isOverdue,
    summary: summarizeBranchCleanup(normalized, now),
  };
}

