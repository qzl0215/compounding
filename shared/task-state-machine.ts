import fs from "node:fs";
import path from "node:path";
import { loadSimpleYamlFile, validateSimpleSchema, type SimpleSchema } from "./simple-yaml.ts";

export type TaskModeId = "planning" | "execution" | "review" | "release";

export type TaskStateId =
  | "planning"
  | "ready"
  | "executing"
  | "review_pending"
  | "reviewing"
  | "release_preparing"
  | "acceptance_pending"
  | "released"
  | "rolled_back"
  | "blocked"
  | "abandoned";

export type TaskDeliveryTrack = "undetermined" | "direct_merge" | "preview_release";

export type TaskTransitionEventId =
  | "create_task"
  | "plan_approved"
  | "preflight_passed"
  | "handoff_created"
  | "review_started"
  | "review_passed"
  | "release_prepared"
  | "acceptance_accepted"
  | "acceptance_rejected"
  | "rollback_completed"
  | "block"
  | "resume"
  | "replan"
  | "abandon";

export type TaskMachineTransitionRecord = {
  event_id: TaskTransitionEventId;
  from_state_id: TaskStateId | null;
  to_state_id: TaskStateId;
  recorded_at: string;
  reason: string | null;
  source: string | null;
};

export type TaskMachineState = {
  state_id: TaskStateId;
  mode_id: TaskModeId;
  delivery_track: TaskDeliveryTrack;
  blocked_from_state: TaskStateId | null;
  resume_to_state: TaskStateId | null;
  blocked_reason: string | null;
  last_transition: TaskMachineTransitionRecord | null;
};

type TaskStateMachineModeDefinition = {
  mode_id: TaskModeId;
  label: string;
  inputs: string[];
  outputs: string[];
};

type TaskStateMachineStateDefinition = {
  state_id: TaskStateId;
  label: string;
  default_mode_id: TaskModeId;
  terminal: boolean;
};

type TaskStateMachineTransitionDefinition = {
  event_id: TaskTransitionEventId;
  from: string[];
  to: string;
  requires_reason?: boolean;
  dynamic_track?: boolean;
  dynamic_resume?: boolean;
};

export type TaskStateMachineSpec = {
  version: string;
  modes: TaskStateMachineModeDefinition[];
  states: TaskStateMachineStateDefinition[];
  transitions: TaskStateMachineTransitionDefinition[];
  delivery_tracks: TaskDeliveryTrack[];
  default_delivery_tracks: Record<"light" | "structural" | "release", TaskDeliveryTrack>;
};

type ChangeClass = "light" | "structural" | "release";

type TransitionOptions = {
  change_class?: ChangeClass | null;
  delivery_track?: TaskDeliveryTrack | string | null;
  reason?: string | null;
  resume_to_state?: TaskStateId | null;
  recorded_at?: string | null;
  source?: string | null;
  root?: string;
};

type CompatMachineOptions = {
  task_status?: string | null;
  delivery_track?: string | null;
  pending_acceptance?: boolean;
  released?: boolean;
  rolled_back?: boolean;
  blocked?: boolean;
  has_handoff?: boolean;
  has_review?: boolean;
};

const TASK_STATE_MACHINE_PATH = path.join("kernel", "task-state-machine.yaml");
const TASK_STATE_MACHINE_SCHEMA_PATH = path.join("schemas", "task-state-machine.schema.yaml");

const FALLBACK_MODE_LABELS: Record<TaskModeId, string> = {
  planning: "规划",
  execution: "执行",
  review: "评审",
  release: "发布",
};

const LEGACY_MODE_TO_MODE_ID: Record<string, TaskModeId> = {
  "战略澄清": "planning",
  "方案评审": "planning",
  "规划": "planning",
  "工程执行": "execution",
  "执行": "execution",
  "质量验收": "review",
  "评审": "review",
  "发布复盘": "release",
  "发布": "release",
};

const cache = new Map<string, TaskStateMachineSpec>();

function resolveProjectRoot(root = process.cwd()) {
  let cursor = path.resolve(root);
  while (true) {
    const specCandidate = path.join(cursor, TASK_STATE_MACHINE_PATH);
    const schemaCandidate = path.join(cursor, TASK_STATE_MACHINE_SCHEMA_PATH);
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
  return path.join(resolveProjectRoot(root), TASK_STATE_MACHINE_PATH);
}

function schemaPath(root = process.cwd()) {
  return path.join(resolveProjectRoot(root), TASK_STATE_MACHINE_SCHEMA_PATH);
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

function validateTaskStateMachineSpec(spec: TaskStateMachineSpec) {
  const modeIds = new Set<TaskModeId>(spec.modes.map((item) => item.mode_id));
  const stateIds = new Set<TaskStateId>(spec.states.map((item) => item.state_id));

  ensureUniqueIds(spec.modes, "mode_id", "mode");
  ensureUniqueIds(spec.states, "state_id", "state");

  for (const state of spec.states) {
    if (!modeIds.has(state.default_mode_id)) {
      throw new Error(`State ${state.state_id} references unknown mode ${state.default_mode_id}.`);
    }
  }

  for (const transition of spec.transitions) {
    for (const fromState of transition.from) {
      if (fromState !== "__new__" && !stateIds.has(fromState as TaskStateId)) {
        throw new Error(`Transition ${transition.event_id} references unknown from state ${fromState}.`);
      }
    }
    if (!["__track__", "__resume__"].includes(transition.to) && !stateIds.has(transition.to as TaskStateId)) {
      throw new Error(`Transition ${transition.event_id} references unknown to state ${transition.to}.`);
    }
  }
}

export function loadTaskStateMachine(root = process.cwd()): TaskStateMachineSpec {
  const key = rootKey(root);
  const cached = cache.get(key);
  if (cached) return cached;

  const spec = loadSimpleYamlFile<TaskStateMachineSpec>(specPath(root));
  const schema = loadSimpleYamlFile<SimpleSchema>(schemaPath(root));
  const schemaErrors = validateSimpleSchema(spec, schema);
  if (schemaErrors.length > 0) {
    throw new Error(`Invalid task state machine schema:\n${schemaErrors.join("\n")}`);
  }
  validateTaskStateMachineSpec(spec);
  cache.set(key, spec);
  return spec;
}

export function clearTaskStateMachineCache() {
  cache.clear();
}

export function normalizeTaskDeliveryTrack(value: string | null | undefined): TaskDeliveryTrack {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "direct_merge" || normalized === "preview_release") return normalized;
  return "undetermined";
}

export function normalizeTaskModeId(value: string | null | undefined): TaskModeId | null {
  const normalized = String(value || "").trim();
  if (!normalized) return null;
  if (normalized in LEGACY_MODE_TO_MODE_ID) {
    return LEGACY_MODE_TO_MODE_ID[normalized];
  }
  if (["planning", "execution", "review", "release"].includes(normalized)) {
    return normalized as TaskModeId;
  }
  return null;
}

export function getTaskModeLabel(modeId: TaskModeId, root = process.cwd()) {
  const spec = loadTaskStateMachine(root);
  return spec.modes.find((item) => item.mode_id === modeId)?.label || FALLBACK_MODE_LABELS[modeId];
}

export function getTaskStateLabel(stateId: TaskStateId, root = process.cwd()) {
  const spec = loadTaskStateMachine(root);
  return spec.states.find((item) => item.state_id === stateId)?.label || stateId;
}

export function getDefaultModeIdForState(stateId: TaskStateId, root = process.cwd()): TaskModeId {
  const spec = loadTaskStateMachine(root);
  return spec.states.find((item) => item.state_id === stateId)?.default_mode_id || "execution";
}

export function deriveTaskStatusFromStateId(stateId: TaskStateId) {
  if (stateId === "blocked") return "blocked";
  if (["planning", "ready"].includes(stateId)) return "todo";
  if (["released", "rolled_back", "abandoned"].includes(stateId)) return "done";
  return "doing";
}

export function deriveTaskDeliveryStatusFromStateId(stateId: TaskStateId) {
  if (stateId === "blocked") return "blocked";
  if (stateId === "acceptance_pending") return "pending_acceptance";
  if (stateId === "rolled_back") return "rolled_back";
  if (stateId === "released") return "released";
  if (["executing", "review_pending", "reviewing", "release_preparing"].includes(stateId)) return "in_progress";
  return "not_started";
}

export function deriveDemandStageFromStateId(stateId: TaskStateId) {
  if (stateId === "planning") return "planning";
  if (stateId === "ready") return "ready";
  if (stateId === "acceptance_pending") return "acceptance";
  if (["released", "rolled_back", "abandoned"].includes(stateId)) return "released";
  return "doing";
}

function inferDeliveryTrackFromChangeClass(changeClass: ChangeClass | null | undefined, root = process.cwd()): TaskDeliveryTrack {
  const spec = loadTaskStateMachine(root);
  if (!changeClass) return "undetermined";
  return spec.default_delivery_tracks[changeClass];
}

function resolveTrack(machine: TaskMachineState, options: TransitionOptions) {
  const explicit = normalizeTaskDeliveryTrack(options.delivery_track);
  if (explicit !== "undetermined") return explicit;
  if (machine.delivery_track !== "undetermined") return machine.delivery_track;
  return inferDeliveryTrackFromChangeClass(options.change_class, options.root || process.cwd());
}

function defaultResumeStateFor(stateId: TaskStateId | null) {
  switch (stateId) {
    case "planning":
    case "ready":
      return "ready";
    case "review_pending":
      return "review_pending";
    case "reviewing":
      return "reviewing";
    case "release_preparing":
      return "release_preparing";
    case "acceptance_pending":
      return "executing";
    case "blocked":
      return "executing";
    default:
      return "executing";
  }
}

export function createInitialTaskMachine(options: TransitionOptions = {}): TaskMachineState {
  const deliveryTrack = normalizeTaskDeliveryTrack(options.delivery_track);
  const recordedAt = options.recorded_at || new Date().toISOString();
  return {
    state_id: "planning",
    mode_id: "planning",
    delivery_track: deliveryTrack,
    blocked_from_state: null,
    resume_to_state: null,
    blocked_reason: null,
    last_transition: {
      event_id: "create_task",
      from_state_id: null,
      to_state_id: "planning",
      recorded_at: recordedAt,
      reason: null,
      source: options.source || null,
    },
  };
}

export function deriveCompatTaskMachine(input: CompatMachineOptions = {}, root = process.cwd()): TaskMachineState {
  const blocked = Boolean(input.blocked || String(input.task_status || "").trim().toLowerCase() === "blocked");
  const pendingAcceptance = Boolean(input.pending_acceptance);
  const rolledBack = Boolean(input.rolled_back);
  const released = Boolean(input.released);
  const doing = String(input.task_status || "").trim().toLowerCase() === "doing";
  const todo = String(input.task_status || "").trim().toLowerCase() === "todo";
  const track = normalizeTaskDeliveryTrack(input.delivery_track);

  if (rolledBack) {
    return {
      state_id: "rolled_back",
      mode_id: "release",
      delivery_track: track === "undetermined" ? "preview_release" : track,
      blocked_from_state: null,
      resume_to_state: null,
      blocked_reason: null,
      last_transition: null,
    };
  }

  if (pendingAcceptance) {
    return {
      state_id: "acceptance_pending",
      mode_id: "release",
      delivery_track: track === "undetermined" ? "preview_release" : track,
      blocked_from_state: null,
      resume_to_state: null,
      blocked_reason: null,
      last_transition: null,
    };
  }

  if (released || String(input.task_status || "").trim().toLowerCase() === "done") {
    return {
      state_id: "released",
      mode_id: "release",
      delivery_track: track === "undetermined" ? "direct_merge" : track,
      blocked_from_state: null,
      resume_to_state: null,
      blocked_reason: null,
      last_transition: null,
    };
  }

  if (blocked) {
    const blockedFrom = "executing";
    return {
      state_id: "blocked",
      mode_id: "execution",
      delivery_track: track,
      blocked_from_state: blockedFrom,
      resume_to_state: defaultResumeStateFor(blockedFrom),
      blocked_reason: null,
      last_transition: null,
    };
  }

  if (input.has_review) {
    return {
      state_id: "reviewing",
      mode_id: "review",
      delivery_track: track,
      blocked_from_state: null,
      resume_to_state: null,
      blocked_reason: null,
      last_transition: null,
    };
  }

  if (input.has_handoff) {
    return {
      state_id: "review_pending",
      mode_id: "review",
      delivery_track: track,
      blocked_from_state: null,
      resume_to_state: null,
      blocked_reason: null,
      last_transition: null,
    };
  }

  if (doing) {
    return {
      state_id: "executing",
      mode_id: "execution",
      delivery_track: track,
      blocked_from_state: null,
      resume_to_state: null,
      blocked_reason: null,
      last_transition: null,
    };
  }

  if (todo) {
    return {
      state_id: "ready",
      mode_id: "planning",
      delivery_track: track,
      blocked_from_state: null,
      resume_to_state: null,
      blocked_reason: null,
      last_transition: null,
    };
  }

  return createInitialTaskMachine({ root });
}

export function normalizeTaskMachineState(input: Partial<TaskMachineState> | null | undefined, root = process.cwd()): TaskMachineState {
  const stateId = String(input?.state_id || "").trim() as TaskStateId;
  const modeId = String(input?.mode_id || "").trim() as TaskModeId;
  const safeState = stateId || "planning";
  const safeMode = modeId || getDefaultModeIdForState(safeState, root);
  return {
    state_id: safeState,
    mode_id: safeMode,
    delivery_track: normalizeTaskDeliveryTrack(input?.delivery_track),
    blocked_from_state: (input?.blocked_from_state || null) as TaskStateId | null,
    resume_to_state: (input?.resume_to_state || null) as TaskStateId | null,
    blocked_reason: input?.blocked_reason || null,
    last_transition: input?.last_transition || null,
  };
}

export function transitionTaskMachine(machineInput: Partial<TaskMachineState> | null | undefined, eventId: TaskTransitionEventId, options: TransitionOptions = {}) {
  const root = options.root || process.cwd();
  const spec = loadTaskStateMachine(root);
  const machine = machineInput ? normalizeTaskMachineState(machineInput, root) : createInitialTaskMachine(options);

  if (eventId === "create_task") {
    return createInitialTaskMachine(options);
  }

  const transition = spec.transitions.find(
    (item) => item.event_id === eventId && item.from.includes(machine.state_id),
  );
  if (!transition) {
    throw new Error(`Transition ${eventId} is not allowed from ${machine.state_id}.`);
  }

  if (transition.requires_reason && !String(options.reason || "").trim()) {
    throw new Error(`Transition ${eventId} requires reason.`);
  }

  const recordedAt = options.recorded_at || new Date().toISOString();
  let nextStateId = transition.to as TaskStateId;
  let nextModeId = getDefaultModeIdForState(nextStateId, root);
  let nextTrack = machine.delivery_track;
  let blockedFromState: TaskStateId | null = null;
  let resumeToState: TaskStateId | null = null;
  let blockedReason: string | null = null;

  if (eventId === "preflight_passed") {
    nextTrack = resolveTrack(machine, options);
    nextStateId = "executing";
    nextModeId = "execution";
  } else if (transition.dynamic_track) {
    nextTrack = resolveTrack(machine, options);
    nextStateId = nextTrack === "preview_release" ? "release_preparing" : "released";
    nextModeId = getDefaultModeIdForState(nextStateId, root);
  } else if (transition.dynamic_resume) {
    nextStateId = (machine.resume_to_state || options.resume_to_state || "executing") as TaskStateId;
    nextModeId = getDefaultModeIdForState(nextStateId, root);
  }

  if (eventId === "acceptance_rejected") {
    nextTrack = "preview_release";
    nextStateId = "blocked";
    nextModeId = "execution";
    blockedFromState = "acceptance_pending";
    resumeToState = "executing";
    blockedReason = String(options.reason || "").trim() || null;
  } else if (eventId === "block") {
    nextStateId = "blocked";
    nextModeId = machine.mode_id;
    blockedFromState = machine.state_id;
    resumeToState = options.resume_to_state || defaultResumeStateFor(machine.state_id);
    blockedReason = String(options.reason || "").trim() || null;
  } else if (eventId === "resume") {
    blockedFromState = null;
    resumeToState = null;
    blockedReason = null;
  } else if (eventId === "replan") {
    nextStateId = "planning";
    nextModeId = "planning";
    blockedFromState = null;
    resumeToState = null;
    blockedReason = null;
  } else if (eventId === "abandon") {
    nextStateId = "abandoned";
    nextModeId = "planning";
    blockedFromState = null;
    resumeToState = null;
    blockedReason = null;
  } else if (eventId !== "review_passed" && eventId !== "preflight_passed") {
    if (nextStateId !== "blocked") {
      nextModeId = getDefaultModeIdForState(nextStateId, root);
    }
  }

  if (eventId !== "acceptance_rejected" && eventId !== "block") {
    blockedFromState = nextStateId === "blocked" ? machine.state_id : null;
    resumeToState = nextStateId === "blocked" ? defaultResumeStateFor(machine.state_id) : null;
    blockedReason = nextStateId === "blocked" ? String(options.reason || "").trim() || null : null;
  }

  return normalizeTaskMachineState(
    {
      state_id: nextStateId,
      mode_id: nextModeId,
      delivery_track: nextTrack,
      blocked_from_state: blockedFromState,
      resume_to_state: resumeToState,
      blocked_reason: blockedReason,
      last_transition: {
        event_id: eventId,
        from_state_id: machine.state_id,
        to_state_id: nextStateId,
        recorded_at: recordedAt,
        reason: String(options.reason || "").trim() || null,
        source: options.source || null,
      },
    },
    root,
  );
}
