export type ReleaseStatus = "prepared" | "active" | "superseded" | "failed" | "rolled_back";
export type ReleaseResult = "pending" | "passed" | "failed";

export type ReleaseRecord = {
  release_id: string;
  commit_sha: string;
  tag: string | null;
  source_ref: string;
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
  releases: ReleaseRecord[];
  local_runtime: LocalRuntimeStatus;
};

export type ReleaseActionResult = {
  ok: boolean;
  message: string;
  release?: ReleaseRecord;
  registry?: ReleaseRegistry;
};
