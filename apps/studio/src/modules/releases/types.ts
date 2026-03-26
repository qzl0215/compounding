import type { TaskCostSnapshot } from "../../../../../shared/task-cost";

export type ReleaseStatus = "prepared" | "preview" | "active" | "superseded" | "failed" | "rolled_back" | "rejected";
export type ReleaseResult = "pending" | "passed" | "failed";
export type ReleaseChannel = "dev" | "prod";
export type AcceptanceStatus = "pending" | "accepted" | "rejected";

export type ReleaseDeliverySnapshot = {
  summary: string | null;
  risk: string | null;
  done_when: string | null;
  change_cost?: TaskCostSnapshot | null;
};

export type ResolvedTaskContractSummary = {
  task_id: string;
  task_path: string;
  short_id: string;
  title: string;
  summary: string | null;
  risk: string | null;
  done_when: string | null;
};

export type ReleaseRecord = {
  release_id: string;
  commit_sha: string;
  tag: string | null;
  source_ref: string;
  primary_task_id: string | null;
  linked_task_ids: string[];
  delivery_snapshot: ReleaseDeliverySnapshot | null;
  resolved_task_contract: ResolvedTaskContractSummary | null;
  channel: ReleaseChannel;
  acceptance_status: AcceptanceStatus;
  preview_url: string | null;
  promoted_to_main_at: string | null;
  promoted_from_dev_release_id: string | null;
  created_at: string;
  status: ReleaseStatus;
  build_result: ReleaseResult;
  smoke_result: ReleaseResult;
  cutover_at: string | null;
  rollback_from: string | null;
  release_path: string;
  change_summary: string[];
  notes: string[];
};

export type ReleaseRegistry = {
  active_release_id: string | null;
  pending_dev_release_id: string | null;
  updated_at: string | null;
  releases: ReleaseRecord[];
};

export type LocalRuntimeStatusType =
  | "stopped"
  | "running"
  | "stale_pid"
  | "port_error"
  | "drift"
  | "unmanaged";

export type LocalRuntimeStatus = {
  status: LocalRuntimeStatusType;
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

export type ManagementAccessState = {
  allowed: boolean;
  reason: string;
};

export type ReleaseDashboard = {
  runtime_root: string;
  active_release_id: string | null;
  active_release: ReleaseRecord | null;
  pending_dev_release: ReleaseRecord | null;
  dev_preview_url: string;
  production_url: string;
  releases: ReleaseRecord[];
  local_runtime: LocalRuntimeStatus;
  local_preview: LocalRuntimeStatus;
};

export type ReleaseTaskOption = {
  id: string;
  label: string;
};

export type ReleaseActionResult = {
  ok: boolean;
  message: string;
  release?: ReleaseRecord;
  registry?: ReleaseRegistry;
};
