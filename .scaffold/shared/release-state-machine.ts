import fs from "node:fs";
import path from "node:path";
import { loadSimpleYamlFile, validateSimpleSchema, type SimpleSchema } from "./simple-yaml.ts";

export type ReleaseStateId = "prepared" | "preview" | "active" | "superseded" | "rejected" | "failed" | "rolled_back";

export type ReleaseTransitionEventId =
  | "prepare_release"
  | "publish_preview"
  | "promote_release"
  | "reject_release"
  | "supersede_release"
  | "rollback_release"
  | "fail_release";

export type ReleaseMachineTransitionRecord = {
  event_id: ReleaseTransitionEventId;
  from_state_id: ReleaseStateId | null;
  to_state_id: ReleaseStateId;
  recorded_at: string;
  reason: string | null;
  source: string | null;
};

export type ReleaseMachineState = {
  state_id: ReleaseStateId;
  state_label: string;
  blocked_reason: string | null;
  last_transition: ReleaseMachineTransitionRecord | null;
};

type ReleaseStateDefinition = {
  state_id: ReleaseStateId;
  label: string;
  terminal: boolean;
};

type ReleaseTransitionDefinition = {
  event_id: ReleaseTransitionEventId;
  from: string[];
  to: string;
  requires_reason?: boolean;
};

export type ReleaseStateMachineSpec = {
  version: string;
  states: ReleaseStateDefinition[];
  transitions: ReleaseTransitionDefinition[];
};

export type ReleaseChannel = "dev" | "prod";
export type ReleaseAcceptanceStatus = "pending" | "accepted" | "rejected";

export type ReleaseStateRecordLike = {
  state_id?: string | null;
  state_label?: string | null;
  status?: string | null;
  acceptance_status?: string | null;
  channel?: ReleaseChannel | null;
  blocked_reason?: string | null;
  last_transition?: ReleaseMachineTransitionRecord | null;
  created_at?: string | null;
  cutover_at?: string | null;
  promoted_to_main_at?: string | null;
  release_id?: string | null;
};

type TransitionOptions = {
  reason?: string | null;
  source?: string | null;
  recorded_at?: string | null;
  root?: string;
  channel?: ReleaseChannel | null;
};

const RELEASE_STATE_MACHINE_PATH = path.join("kernel", "release-state-machine.yaml");
const RELEASE_STATE_MACHINE_SCHEMA_PATH = path.join("schemas", "release-state-machine.schema.yaml");

const FALLBACK_STATE_LABELS: Record<ReleaseStateId, string> = {
  prepared: "已准备",
  preview: "预览中",
  active: "当前版本",
  superseded: "已被替代",
  rejected: "已驳回",
  failed: "失败",
  rolled_back: "已回滚",
};

const cache = new Map<string, ReleaseStateMachineSpec>();

function resolveProjectRoot(root = process.cwd()) {
  let cursor = path.resolve(root);
  while (true) {
    const specCandidate = path.join(cursor, RELEASE_STATE_MACHINE_PATH);
    const schemaCandidate = path.join(cursor, RELEASE_STATE_MACHINE_SCHEMA_PATH);
    if (fs.existsSync(specCandidate) && fs.existsSync(schemaCandidate)) {
      return cursor;
    }
    const parent = path.dirname(cursor);
    if (!parent || parent === cursor) {
      return path.resolve(root);
    }
    cursor = parent;
  }
}

function rootKey(root = process.cwd()) {
  return resolveProjectRoot(root);
}

function specPath(root = process.cwd()) {
  return path.join(resolveProjectRoot(root), RELEASE_STATE_MACHINE_PATH);
}

function schemaPath(root = process.cwd()) {
  return path.join(resolveProjectRoot(root), RELEASE_STATE_MACHINE_SCHEMA_PATH);
}

function ensureUniqueIds<T extends { [key: string]: unknown }>(items: T[], key: keyof T, label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    const value = String(item[key] || "").trim();
    if (!value) throw new Error(`${label} is missing ${String(key)}.`);
    if (seen.has(value)) throw new Error(`Duplicate ${label} id: ${value}`);
    seen.add(value);
  }
}

function validateReleaseStateMachineSpec(spec: ReleaseStateMachineSpec) {
  const stateIds = new Set<ReleaseStateId>(spec.states.map((item) => item.state_id));

  ensureUniqueIds(spec.states, "state_id", "state");

  for (const transition of spec.transitions) {
    for (const fromState of transition.from) {
      if (fromState !== "__new__" && !stateIds.has(fromState as ReleaseStateId)) {
        throw new Error(`Transition ${transition.event_id} references unknown from state ${fromState}.`);
      }
    }
    if (!stateIds.has(transition.to as ReleaseStateId)) {
      throw new Error(`Transition ${transition.event_id} references unknown to state ${transition.to}.`);
    }
  }
}

export function loadReleaseStateMachine(root = process.cwd()): ReleaseStateMachineSpec {
  const key = rootKey(root);
  const cached = cache.get(key);
  if (cached) return cached;

  const spec = loadSimpleYamlFile<ReleaseStateMachineSpec>(specPath(root));
  const schema = loadSimpleYamlFile<SimpleSchema>(schemaPath(root));
  const schemaErrors = validateSimpleSchema(spec, schema);
  if (schemaErrors.length > 0) {
    throw new Error(`Invalid release state machine schema:\n${schemaErrors.join("\n")}`);
  }
  validateReleaseStateMachineSpec(spec);
  cache.set(key, spec);
  return spec;
}

export function clearReleaseStateMachineCache() {
  cache.clear();
}

export function normalizeReleaseStateId(value: string | null | undefined): ReleaseStateId | null {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (["prepared", "preview", "active", "superseded", "rejected", "failed", "rolled_back"].includes(normalized)) {
    return normalized as ReleaseStateId;
  }
  return null;
}

export function getReleaseStateLabel(stateId: ReleaseStateId, root = process.cwd()) {
  const spec = loadReleaseStateMachine(root);
  return spec.states.find((item) => item.state_id === stateId)?.label || FALLBACK_STATE_LABELS[stateId];
}

export function deriveReleaseAcceptanceStatus(stateId: ReleaseStateId, channel: ReleaseChannel | null | undefined): ReleaseAcceptanceStatus {
  if (stateId === "rejected" || stateId === "failed") return "rejected";
  if (stateId === "preview") return "pending";
  if (stateId === "prepared") return channel === "dev" ? "pending" : "accepted";
  return "accepted";
}

export function deriveReleaseStatusFromStateId(stateId: ReleaseStateId) {
  return stateId;
}

export function normalizeReleaseMachineState(
  input: ReleaseStateRecordLike | null | undefined,
  root = process.cwd(),
): ReleaseMachineState {
  const stateId = normalizeReleaseStateId(input?.state_id) || normalizeReleaseStateId(input?.status) || "prepared";
  const stateLabel = getReleaseStateLabel(stateId, root);
  const transition = input?.last_transition || null;
  return {
    state_id: stateId,
    state_label: stateLabel,
    blocked_reason: input?.blocked_reason || null,
    last_transition: transition
      ? {
          ...transition,
          event_id: transition.event_id,
          from_state_id: normalizeReleaseStateId(transition.from_state_id) || null,
          to_state_id: normalizeReleaseStateId(transition.to_state_id) || stateId,
        }
      : null,
  };
}

export function transitionReleaseState(
  machineInput: ReleaseStateRecordLike | null | undefined,
  eventId: ReleaseTransitionEventId,
  options: TransitionOptions = {},
): ReleaseMachineState {
  const root = options.root || process.cwd();
  const spec = loadReleaseStateMachine(root);
  const machine = machineInput ? normalizeReleaseMachineState(machineInput, root) : null;
  const hasExplicitSource =
    Boolean(normalizeReleaseStateId(machineInput?.state_id)) ||
    Boolean(normalizeReleaseStateId(machineInput?.status)) ||
    Boolean(machineInput?.last_transition);
  const fromStateId = hasExplicitSource ? machine?.state_id || null : null;
  const transition = spec.transitions.find((item) => item.event_id === eventId && item.from.includes(fromStateId || "__new__"));
  if (!transition) {
    throw new Error(`Transition ${eventId} is not allowed from ${fromStateId || "__new__"}.`);
  }
  if (transition.requires_reason && !String(options.reason || "").trim()) {
    throw new Error(`Transition ${eventId} requires reason.`);
  }
  const nextStateId = transition.to as ReleaseStateId;
  const recordedAt = options.recorded_at || new Date().toISOString();
  return {
    state_id: nextStateId,
    state_label: getReleaseStateLabel(nextStateId, root),
    blocked_reason: String(options.reason || "").trim() || null,
    last_transition: {
      event_id: eventId,
      from_state_id: fromStateId,
      to_state_id: nextStateId,
      recorded_at: recordedAt,
      reason: String(options.reason || "").trim() || null,
      source: options.source || null,
    },
  };
}

export function transitionReleaseRecord<T extends ReleaseStateRecordLike>(
  record: T | null | undefined,
  eventId: ReleaseTransitionEventId,
  options: TransitionOptions = {},
): T & ReleaseMachineState & {
  status: ReleaseStateId;
  acceptance_status: ReleaseAcceptanceStatus;
  channel: ReleaseChannel | null;
} {
  const nextState = transitionReleaseState(record, eventId, options);
  const channel = (options.channel || record?.channel || null) as ReleaseChannel | null;
  const nextStatus = deriveReleaseStatusFromStateId(nextState.state_id);
  const nextAcceptance = deriveReleaseAcceptanceStatus(nextState.state_id, channel);
  return {
    ...(record || ({} as T)),
    ...nextState,
    channel,
    status: nextStatus,
    acceptance_status: nextAcceptance,
    state_id: nextState.state_id,
    state_label: nextState.state_label,
    blocked_reason: nextState.blocked_reason,
    last_transition: nextState.last_transition,
  };
}
