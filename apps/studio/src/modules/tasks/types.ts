export type TaskStatus = "todo" | "doing" | "blocked" | "done";

export type TaskGitState = "missing_branch" | "developing" | "committed" | "merged" | "drift";

export type TaskUpdateTrace = {
  memory: string;
  index: string;
  roadmap: string;
  docs: string;
};

export type TaskDeliveryStatus = "not_started" | "in_progress" | "pending_acceptance" | "released" | "rolled_back" | "blocked";

export type TaskGitInfo = {
  branch: string;
  recentCommit: string;
  mergedToMain: boolean;
  state: TaskGitState;
  detail: string;
};

export type TaskCard = {
  id: string;
  path: string;
  shortId: string;
  title: string;
  goal: string;
  status: TaskStatus;
  currentMode: string;
  branch: string;
  recentCommit: string;
  deliveryBenefit: string;
  deliveryRisk: string;
  deliveryRetro: string;
  primaryRelease: string;
  linkedReleases: string[];
  git: TaskGitInfo;
  relatedModules: string[];
  updateTrace: TaskUpdateTrace;
};

export type TaskGroup = {
  status: TaskStatus;
  label: string;
  tasks: TaskCard[];
};

export type TaskDeliveryRow = TaskCard & {
  deliveryStatus: TaskDeliveryStatus;
  versionLabel: string;
  acceptReleaseId: string | null;
  rollbackReleaseId: string | null;
  linkedTaskIds: string[];
};
