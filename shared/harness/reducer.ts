import { getTaskModeLabel, getTaskStateLabel } from "../task-state-machine.ts";
import { decideNextHarnessAction } from "./actions.ts";
import type {
  HarnessArtifact,
  HarnessCompatibilitySummary,
  HarnessContract,
  HarnessEvent,
  HarnessEventType,
  HarnessIntent,
  HarnessLiveSnapshot,
  HarnessReducerState,
  HarnessRuntimeFact,
  HarnessState,
} from "./types.ts";

function emptyWorkflow() {
  return {
    task_id: null,
    task_path: null,
    state_id: "idle" as const,
    state_label: "空闲",
    mode_id: null,
    mode_label: null,
    delivery_track: "undetermined" as const,
    blocked_reason: null,
    last_event_id: null,
  };
}

export function createEmptyHarnessReducerState(): HarnessReducerState {
  return {
    intents: {},
    contracts: {},
    active_intent_id: null,
    active_contract_id: null,
    workflow: emptyWorkflow(),
    artifacts: [],
    runtime_facts: {},
  };
}

function pushArtifact(state: HarnessReducerState, artifact: HarnessArtifact | null) {
  if (!artifact) return state;
  const existing = state.artifacts.filter((item) => item.artifact_id !== artifact.artifact_id);
  return {
    ...state,
    artifacts: [...existing, artifact].slice(-20),
  };
}

function toArtifact(event: HarnessEvent): HarnessArtifact | null {
  if (event.event_type === "contract.materialized") {
    const payload = event.payload as { task_path?: string; title?: string };
    return {
      artifact_id: `${event.event_id}:task`,
      artifact_type: "task",
      task_id: event.task_id,
      path: payload.task_path || null,
      label: payload.title || "任务合同",
      recorded_at: event.recorded_at,
    };
  }
  if (event.event_type === "preflight.observed") {
    const payload = event.payload as { decision_card_path?: string | null };
    if (!payload.decision_card_path) return null;
    return {
      artifact_id: `${event.event_id}:decision`,
      artifact_type: "decision",
      task_id: event.task_id,
      path: payload.decision_card_path,
      label: "preflight 决策卡",
      recorded_at: event.recorded_at,
    };
  }
  if (event.event_type === "review.recorded") {
    const payload = event.payload as { diff_summary_path?: string | null };
    if (!payload.diff_summary_path) return null;
    return {
      artifact_id: `${event.event_id}:diff`,
      artifact_type: "diff_summary",
      task_id: event.task_id,
      path: payload.diff_summary_path,
      label: "review diff 摘要",
      recorded_at: event.recorded_at,
    };
  }
  if (event.event_type === "release.recorded") {
    const payload = event.payload as { release_id?: string | null };
    return {
      artifact_id: `${event.event_id}:release`,
      artifact_type: "release",
      task_id: event.task_id,
      path: null,
      label: payload.release_id || "release",
      recorded_at: event.recorded_at,
    };
  }
  if (event.event_type === "handoff.recorded") {
    return {
      artifact_id: `${event.event_id}:handoff`,
      artifact_type: "handoff",
      task_id: event.task_id,
      path: null,
      label: "handoff",
      recorded_at: event.recorded_at,
    };
  }
  return null;
}

export function reduceHarnessEvent(stateInput: HarnessReducerState, event: HarnessEvent): HarnessReducerState {
  let state = {
    ...stateInput,
    intents: { ...stateInput.intents },
    contracts: { ...stateInput.contracts },
    runtime_facts: { ...stateInput.runtime_facts },
    artifacts: [...stateInput.artifacts],
    workflow: { ...stateInput.workflow },
  };

  if (event.event_type === "intent.created") {
    const payload = event.payload as { intent: HarnessIntent };
    state.intents[payload.intent.intent_id] = payload.intent;
    state.active_intent_id = payload.intent.intent_id;
  }

  if (event.event_type === "contract.materialized") {
    const payload = event.payload as { contract: HarnessContract };
    state.contracts[payload.contract.contract_id] = payload.contract;
    state.active_contract_id = payload.contract.contract_id;
    state.workflow = {
      task_id: payload.contract.task_id,
      task_path: payload.contract.task_path,
      state_id: payload.contract.state_id,
      state_label: getTaskStateLabel(payload.contract.state_id),
      mode_id: payload.contract.mode_id,
      mode_label: getTaskModeLabel(payload.contract.mode_id),
      delivery_track: payload.contract.delivery_track,
      blocked_reason: null,
      last_event_id: event.event_id,
    };
  }

  if (event.event_type === "task.transitioned") {
    const payload = event.payload as {
      task_id: string;
      task_path?: string | null;
      state_id: HarnessContract["state_id"];
      mode_id: HarnessContract["mode_id"];
      delivery_track: HarnessContract["delivery_track"];
      blocked_reason?: string | null;
    };
    state.workflow = {
      task_id: payload.task_id,
      task_path: payload.task_path || state.workflow.task_path || null,
      state_id: payload.state_id,
      state_label: getTaskStateLabel(payload.state_id),
      mode_id: payload.mode_id,
      mode_label: getTaskModeLabel(payload.mode_id),
      delivery_track: payload.delivery_track,
      blocked_reason: payload.blocked_reason || null,
      last_event_id: event.event_id,
    };
  }

  if (event.event_type === "runtime.observed") {
    const payload = event.payload as { fact: HarnessRuntimeFact };
    state.runtime_facts[payload.fact.profile] = payload.fact;
  }

  state = pushArtifact(state, toArtifact(event));
  return state;
}

export function reduceHarnessEvents(events: HarnessEvent[]) {
  return events.reduce((state, event) => reduceHarnessEvent(state, event), createEmptyHarnessReducerState());
}

function findContractByTaskId(state: HarnessReducerState, taskId: string | null) {
  if (!taskId) return null;
  return Object.values(state.contracts).find((contract) => contract.task_id === taskId) || null;
}

export function buildHarnessSnapshotFromReducer(
  state: HarnessReducerState,
  compatibility: HarnessCompatibilitySummary,
  liveState: HarnessState,
): HarnessLiveSnapshot {
  const activeContract =
    (state.active_contract_id ? state.contracts[state.active_contract_id] || null : null) ||
    findContractByTaskId(state, state.workflow.task_id) ||
    null;
  const activeIntent =
    (state.active_intent_id ? state.intents[state.active_intent_id] || null : null) ||
    (activeContract
      ? {
          intent_id: `intent:${activeContract.task_id}`,
          task_id: activeContract.task_id,
          summary: activeContract.summary,
          why_now: activeContract.why_now,
          success_criteria: activeContract.done_when,
          constraints: activeContract.constraints,
          acceptance_owner: "human",
          created_at: new Date(0).toISOString(),
          source: "compat.task_contract",
        }
      : null);
  const nextAction = decideNextHarnessAction(activeContract, liveState.workflow, liveState.hygiene, liveState.runtime_alignment);

  return {
    schema_version: "1",
    generated_at: new Date().toISOString(),
    active_intent: activeIntent,
    active_contract: activeContract,
    state: liveState,
    next_action: nextAction,
    current_executor: {
      role: nextAction?.owner || "harness",
      reason: nextAction?.reason || "当前没有待执行动作。",
    },
    artifacts: state.artifacts.slice(-8).reverse(),
    compatibility,
  };
}
