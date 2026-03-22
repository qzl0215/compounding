export type HomeEntryLink = {
  href: string;
  label: string;
  scope: "agents" | "roadmap" | "memory" | "tasks" | "release";
};

export type SemanticEntry = {
  label: string;
  path: string;
};

export type SemanticEntryGroup = {
  title: string;
  items: SemanticEntry[];
};

export type CockpitIdentity = {
  oneLiner: string;
};

export type CockpitCurrentFocus = {
  currentPhase: string;
  currentPriority: string;
  currentMilestone: string;
  successCriteria: string[];
};

export type CockpitRuntimeSignal = {
  label: string;
  status: string;
  summary: string;
  href: string;
};

export type CockpitExecutionStatus = {
  summary: string;
  blockedItems: string[];
  nextCheckpoint: string[];
  runtimeSignals: CockpitRuntimeSignal[];
};

export type CockpitRiskBoard = {
  frozenItems: string[];
  pendingDevSummary: string | null;
};

export type ProjectCockpit = {
  identity: CockpitIdentity;
  currentFocus: CockpitCurrentFocus;
  executionStatus: CockpitExecutionStatus;
  riskBoard: CockpitRiskBoard;
};
