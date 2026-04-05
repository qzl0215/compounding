import fs from "node:fs";
import path from "node:path";
import {
  buildTaskBranchCleanupView,
  normalizeBranchCleanupRecord,
  type BranchCleanupRecord,
  type TaskBranchCleanupView,
} from "../../../../../shared/branch-cleanup";
import {
  getTaskModeLabel,
  getTaskStateLabel,
  normalizeTaskMachineState,
  type TaskMachineState,
  type TaskTransitionEventId,
} from "../../../../../shared/task-state-machine";

type CompanionReleaseNote = {
  release_id?: string | null;
  recorded_at?: string | null;
};

type CompanionSearchEvidence = {
  recorded_at?: string | null;
  sources?: string[];
  conclusion?: string | null;
};

type CompanionLifecycle = {
  handoff?: {
    git_head?: string | null;
  } | null;
  release_handoff?: CompanionReleaseNote | null;
};

type CompanionLock = {
  target?: string | null;
};

type TaskCompanionShape = {
  task_id?: string | null;
  task_path?: string | null;
  contract_hash?: string | null;
  branch_name?: string | null;
  completion_mode?: string | null;
  planned_files?: string[];
  planned_modules?: string[];
  machine?: Partial<TaskMachineState> | null;
  locks?: CompanionLock[];
  lifecycle?: CompanionLifecycle;
  artifacts?: {
    branch_cleanup?: Partial<BranchCleanupRecord> | null;
    decision_cards?: { path?: string | null }[];
    diff_summaries?: { path?: string | null }[];
    release_notes?: CompanionReleaseNote[];
    search_evidence?: CompanionSearchEvidence[];
  };
};

export type TaskCompanionFacts = {
  contractHash: string;
  stateId: TaskMachineState["state_id"];
  stateLabel: string;
  modeId: TaskMachineState["mode_id"];
  modeLabel: string;
  deliveryTrack: TaskMachineState["delivery_track"];
  blockedFromState: TaskMachineState["blocked_from_state"];
  resumeToState: TaskMachineState["resume_to_state"];
  blockedReason: string;
  lastTransitionEvent: TaskTransitionEventId | null;
  branch: string;
  recentCommit: string;
  completionMode: string;
  releaseIds: string[];
  latestReleaseId: string | null;
  plannedFiles: string[];
  plannedModules: string[];
  locks: string[];
  artifactRefs: string[];
  latestSearchEvidence: string;
  branchCleanup: TaskBranchCleanupView | null;
};

export function readTaskCompanionFacts(taskId: string): TaskCompanionFacts {
  const companionPath = path.join(process.cwd(), "agent-coordination", "tasks", `${taskId}.json`);
  if (!fs.existsSync(companionPath)) {
    return {
      contractHash: "",
      stateId: "planning",
      stateLabel: getTaskStateLabel("planning"),
      modeId: "planning",
      modeLabel: getTaskModeLabel("planning"),
      deliveryTrack: "undetermined",
      blockedFromState: null,
      resumeToState: null,
      blockedReason: "",
      lastTransitionEvent: null,
      branch: "",
      recentCommit: "",
      completionMode: "close_full_contract",
      releaseIds: [],
      latestReleaseId: null,
      plannedFiles: [],
      plannedModules: [],
      locks: [],
      artifactRefs: [],
      latestSearchEvidence: "",
      branchCleanup: null,
    };
  }

  try {
    const companion = JSON.parse(fs.readFileSync(companionPath, "utf8")) as TaskCompanionShape;
    const notes = companion.artifacts?.release_notes ?? [];
    const searchEvidence = companion.artifacts?.search_evidence ?? [];
    const latestSearch = searchEvidence.at(-1);
    const releaseIds = Array.from(
      new Set(
        notes
          .map((note) => String(note?.release_id || "").trim())
          .filter(Boolean)
      )
    );
    const machine = normalizeTaskMachineState(companion.machine);
    return {
      contractHash: String(companion.contract_hash || "").trim(),
      stateId: machine.state_id,
      stateLabel: getTaskStateLabel(machine.state_id),
      modeId: machine.mode_id,
      modeLabel: getTaskModeLabel(machine.mode_id),
      deliveryTrack: machine.delivery_track,
      blockedFromState: machine.blocked_from_state,
      resumeToState: machine.resume_to_state,
      blockedReason: String(machine.blocked_reason || "").trim(),
      lastTransitionEvent: machine.last_transition?.event_id || null,
      branch: String(companion.branch_name || "").trim(),
      recentCommit: sanitizeCommit(companion.lifecycle?.handoff?.git_head),
      completionMode: String(companion.completion_mode || "").trim() || "close_full_contract",
      releaseIds,
      latestReleaseId: String(companion.lifecycle?.release_handoff?.release_id || "").trim() || releaseIds.at(-1) || null,
      plannedFiles: uniqueStrings(companion.planned_files ?? []),
      plannedModules: uniqueStrings(companion.planned_modules ?? []),
      locks: uniqueStrings((companion.locks ?? []).map((lock) => String(lock?.target || "").trim())),
      artifactRefs: uniqueStrings([
        ...(companion.artifacts?.decision_cards ?? []).map((item) => String(item?.path || "").trim()),
        ...(companion.artifacts?.diff_summaries ?? []).map((item) => String(item?.path || "").trim()),
      ]),
      latestSearchEvidence: String(latestSearch?.conclusion || "").trim(),
      branchCleanup: buildTaskBranchCleanupView(normalizeBranchCleanupRecord(companion.artifacts?.branch_cleanup)),
    };
  } catch {
    return {
      contractHash: "",
      stateId: "planning",
      stateLabel: getTaskStateLabel("planning"),
      modeId: "planning",
      modeLabel: getTaskModeLabel("planning"),
      deliveryTrack: "undetermined",
      blockedFromState: null,
      resumeToState: null,
      blockedReason: "",
      lastTransitionEvent: null,
      branch: "",
      recentCommit: "",
      completionMode: "close_full_contract",
      releaseIds: [],
      latestReleaseId: null,
      plannedFiles: [],
      plannedModules: [],
      locks: [],
      artifactRefs: [],
      latestSearchEvidence: "",
      branchCleanup: null,
    };
  }
}

function sanitizeCommit(value: string | null | undefined) {
  return String(value || "").trim().replace(/^([0-9a-f]{7}).*$/i, "$1");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
}
