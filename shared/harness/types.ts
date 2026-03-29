import type { TaskDeliveryTrack, TaskModeId, TaskStateId } from "../task-state-machine.ts";

export type HarnessActionId =
  | "materialize_contract"
  | "clean_workspace"
  | "run_preflight"
  | "start_execution"
  | "create_handoff"
  | "run_review"
  | "prepare_release"
  | "accept_release"
  | "observe_runtime"
  | "complete_direct_merge";

export type HarnessActorRole = "human" | "harness" | "agent" | "runtime";

export type HarnessIntent = {
  intent_id: string;
  task_id: string | null;
  summary: string;
  why_now: string;
  success_criteria: string;
  constraints: string;
  acceptance_owner: HarnessActorRole;
  created_at: string;
  source: string | null;
};

export type HarnessContract = {
  contract_id: string;
  task_id: string;
  task_path: string;
  short_id: string;
  title: string;
  summary: string;
  why_now: string;
  boundary: string;
  done_when: string;
  constraints: string;
  risk: string;
  delivery_track: TaskDeliveryTrack;
  state_id: TaskStateId;
  mode_id: TaskModeId;
  branch_name: string;
  latest_release_id: string | null;
};

export type HarnessArtifact = {
  artifact_id: string;
  artifact_type: "task" | "decision" | "diff_summary" | "release" | "handoff" | "review";
  task_id: string | null;
  path: string | null;
  label: string;
  recorded_at: string;
};

export type HarnessRuntimeFact = {
  profile: "prod" | "dev";
  status: "stopped" | "running" | "stale_pid" | "port_error" | "drift" | "unmanaged";
  runtime_release_id: string | null;
  current_release_id: string | null;
  drift: boolean;
  observed_at: string;
  reason: string;
};

export type HarnessAction = {
  action_id: HarnessActionId;
  label: string;
  owner: HarnessActorRole;
  task_id: string | null;
  command: string | null;
  reason: string;
};

export type HarnessWorkflowState = {
  task_id: string | null;
  task_path: string | null;
  state_id: TaskStateId | "idle";
  state_label: string;
  mode_id: TaskModeId | null;
  mode_label: string | null;
  delivery_track: TaskDeliveryTrack | "undetermined";
  blocked_reason: string | null;
  last_event_id: string | null;
};

export type HarnessHygieneState = {
  branch: string;
  head_sha: string | null;
  has_upstream: boolean;
  worktree_clean: boolean;
  blockers: string[];
  notes: string[];
};

export type HarnessRuntimeAlignment = {
  target_channel: "dev" | "prod" | null;
  target_release_id: string | null;
  observed_release_id: string | null;
  aligned: boolean;
  reason: string;
};

export type HarnessState = {
  workflow: HarnessWorkflowState;
  hygiene: HarnessHygieneState;
  runtime_alignment: HarnessRuntimeAlignment;
};

export type HarnessEventType =
  | "intent.created"
  | "contract.materialized"
  | "task.transitioned"
  | "preflight.observed"
  | "handoff.recorded"
  | "review.recorded"
  | "release.recorded"
  | "runtime.observed";

export type HarnessEvent = {
  event_id: string;
  event_type: HarnessEventType;
  recorded_at: string;
  source: string | null;
  task_id: string | null;
  payload: Record<string, unknown>;
};

export type HarnessReducerState = {
  intents: Record<string, HarnessIntent>;
  contracts: Record<string, HarnessContract>;
  active_intent_id: string | null;
  active_contract_id: string | null;
  workflow: HarnessWorkflowState;
  artifacts: HarnessArtifact[];
  runtime_facts: Partial<Record<"prod" | "dev", HarnessRuntimeFact>>;
};

export type HarnessCompatibilitySummary = {
  runtime_root: string;
  active_release_id: string | null;
  pending_dev_release_id: string | null;
  active_task_count: number;
  blocked_task_count: number;
  local_runtime: {
    status: "stopped" | "running" | "stale_pid" | "port_error" | "drift" | "unmanaged";
    running: boolean;
    port: number;
    pid: number | null;
    runtime_release_id: string | null;
    current_release_id: string | null;
    drift: boolean;
    reason: string;
    log_path: string;
    state_path: string;
  };
  local_preview: {
    status: "stopped" | "running" | "stale_pid" | "port_error" | "drift" | "unmanaged";
    running: boolean;
    port: number;
    pid: number | null;
    runtime_release_id: string | null;
    current_release_id: string | null;
    drift: boolean;
    reason: string;
    log_path: string;
    state_path: string;
  };
};

export type HarnessLiveSnapshot = {
  schema_version: "1";
  generated_at: string;
  active_intent: HarnessIntent | null;
  active_contract: HarnessContract | null;
  state: HarnessState;
  next_action: HarnessAction | null;
  current_executor: {
    role: HarnessActorRole;
    reason: string;
  };
  artifacts: HarnessArtifact[];
  compatibility: HarnessCompatibilitySummary;
};
