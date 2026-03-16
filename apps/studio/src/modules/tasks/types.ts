export type TaskStatus = "todo" | "doing" | "blocked" | "done";

export type TaskGitState = "missing_branch" | "developing" | "committed" | "merged" | "drift";

export type TaskUpdateTrace = {
  memory: string;
  index: string;
  roadmap: string;
  docs: string;
};

export type TaskGitInfo = {
  branch: string;
  recentCommit: string;
  mergedToMain: boolean;
  state: TaskGitState;
  detail: string;
};

export type TaskCard = {
  path: string;
  title: string;
  goal: string;
  status: TaskStatus;
  branch: string;
  recentCommit: string;
  git: TaskGitInfo;
  relatedModules: string[];
  updateTrace: TaskUpdateTrace;
};

export type TaskGroup = {
  status: TaskStatus;
  label: string;
  tasks: TaskCard[];
};
