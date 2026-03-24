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

export type TaskMachineFacts = {
  contractHash: string;
  branch: string;
  recentCommit: string;
  completionMode: string;
  primaryRelease: string;
  linkedReleases: string[];
  companionReleaseIds: string[];
  companionLatestRelease: string | null;
  relatedModules: string[];
  updateTrace: TaskUpdateTrace;
  locks: string[];
  artifactRefs: string[];
  latestSearchEvidence: string;
  git: TaskGitInfo;
};

export type TaskContract = {
  id: string;
  path: string;
  shortId: string;
  title: string;
  status: TaskStatus;
  parentPlan: string;
  summary: string;
  whyNow: string;
  boundary: string;
  doneWhen: string;
  inScope: string;
  outOfScope: string;
  constraints: string;
  risk: string;
  testStrategy: string;
  acceptanceResult: string;
  deliveryResult: string;
  retro: string;
};

export type TaskCard = TaskContract & {
  currentMode: string;
  machine: TaskMachineFacts;
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
