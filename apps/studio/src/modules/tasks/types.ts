export type TaskStatus = "todo" | "doing" | "blocked" | "done";

export type TaskUpdateTrace = {
  memory: string;
  index: string;
  roadmap: string;
  docs: string;
};

export type TaskCard = {
  path: string;
  title: string;
  goal: string;
  status: TaskStatus;
  relatedModules: string[];
  updateTrace: TaskUpdateTrace;
};

export type TaskGroup = {
  status: TaskStatus;
  label: string;
  tasks: TaskCard[];
};
