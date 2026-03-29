export type LearningSignalKind = "execution_blocker" | "shortcut_gap";

export type LearningSignal = {
  kind: LearningSignalKind;
  pattern_key: string;
  task_id: string | null;
  stage: string;
  source: string;
  first_seen_at: string | null;
  last_seen_at: string | null;
  repeat_count: number;
  lost_time_ms: number;
  missed_savings_est: number;
  related_docs: string[];
  evidence: Record<string, unknown>;
};

export type LearningHint = {
  kind: LearningSignalKind;
  pattern_key: string;
  label: string;
  reason: string;
  recommended_next_action: string;
  recommended_summary_shortcut: string | null;
  repeat_count: number;
  lost_time_ms: number;
  missed_savings_est: number;
};

export type LearningCandidate = {
  candidate_id: string;
  pattern_key: string;
  kind: LearningSignalKind;
  task_count: number;
  repeat_count: number;
  lost_time_ms: number;
  missed_savings_est: number;
  current_task_alert: boolean;
  promotion_ready: boolean;
  recommended_next_action: string;
  recommended_summary_shortcut: string | null;
  related_docs: string[];
  sample_tasks: string[];
  evidence: Record<string, unknown>;
};

export type PromotionProposal = {
  proposal_id: string;
  promotion_semantics: "blueprint_then_task";
  planning_summary: string;
  why_now: string;
  boundary: string;
  done_when: string;
  evidence: {
    task_count: number;
    repeat_count: number;
    lost_time_ms: number;
    missed_savings_est: number;
    sample_task_ids: string[];
  };
  suggested_target: "operating-blueprint";
  task_draft_scaffold: {
    summary: string;
    why: string;
    boundary: string;
    done_when: string;
  };
};

export const LEARNING_PROMOTION_SEMANTICS = "blueprint_then_task" as const;
export const LEARNING_HINT_REPEAT_THRESHOLD = 2;
export const LEARNING_PROMOTION_TASK_THRESHOLD = 2;
export const LEARNING_PROMOTION_LOST_TIME_MS = 10 * 60 * 1000;
export const LEARNING_PROMOTION_MISSED_SAVINGS_EST = 20_000;

export function normalizeLearningToken(value: unknown, fallback = "") {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
}

export function uniqueLearningStrings(values: Array<unknown> = []) {
  return Array.from(new Set(values.map((value) => normalizeLearningToken(value)).filter(Boolean)));
}

export function slugifyLearningToken(value: unknown, fallback = "candidate") {
  const slug = normalizeLearningToken(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || fallback;
}

export function buildExecutionBlockerPatternKey(stage: unknown, signature: unknown) {
  const normalizedStage = normalizeLearningToken(stage, "unknown");
  const normalizedSignature = normalizeLearningToken(signature, "unspecified");
  return `execution_blocker:${normalizedStage}:${normalizedSignature}`;
}

export function buildShortcutGapPatternKey(shortcutId: unknown, missedContext = "deterministic_missed") {
  const normalizedShortcutId = normalizeLearningToken(shortcutId, "unknown");
  const normalizedContext = normalizeLearningToken(missedContext, "deterministic_missed");
  return `shortcut_gap:${normalizedShortcutId}:${normalizedContext}`;
}
