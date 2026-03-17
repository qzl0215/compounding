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

export type TaskSummary = {
  title: string;
  goal: string;
  status: string;
  path: string;
  relatedModules: string[];
  updateTrace: string;
};

export type OverviewSnippet = {
  label: string;
  path: string;
  content: string;
};

export type CockpitIdentity = {
  oneLiner: string;
  mission: string;
  successDefinition: string;
  mustProtect: string[];
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
  headline: string;
  summary: string;
  doingTasks: TaskSummary[];
  blockedItems: string[];
  nextCheckpoint: string[];
  runtimeSignals: CockpitRuntimeSignal[];
};

export type CockpitRiskTone = "stable" | "warning" | "danger";

export type CockpitRiskItem = {
  title: string;
  summary: string;
  tone: CockpitRiskTone;
  href: string;
};

export type CockpitRiskBoard = {
  factConflicts: string[];
  frozenItems: string[];
  items: CockpitRiskItem[];
};

export type CockpitEvidenceLink = {
  title: string;
  summary: string;
  href: string;
};

export type CockpitEvidenceGroup = {
  title: string;
  items: CockpitEvidenceLink[];
};

export type ProjectCockpit = {
  identity: CockpitIdentity;
  currentFocus: CockpitCurrentFocus;
  executionStatus: CockpitExecutionStatus;
  riskBoard: CockpitRiskBoard;
  evidenceLinks: CockpitEvidenceGroup[];
};

