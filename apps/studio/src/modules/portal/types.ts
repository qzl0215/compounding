export type HomeEntryLink = {
  href: string;
  label: string;
  description: string;
  scope: "agents" | "roadmap" | "memory" | "tasks" | "release";
};

export type HomepageStat = {
  label: string;
  value: string;
};

export type HomepageStageStat = {
  label: string;
  value: string;
  hint: string;
};

export type HomepageDecision = {
  title: string;
  summary: string;
  evidenceHref: string;
  ctaLabel: string;
  badge?: string;
};

export type SemanticEntry = {
  label: string;
  path?: string;
  href?: string;
  description?: string;
};

export type SemanticEntryGroup = {
  title: string;
  description?: string;
  items: SemanticEntry[];
};

export type ProjectOverviewSummary = {
  oneLiner: string;
  currentPhase: string;
  currentMilestone: string;
  currentPriority: string;
};

export type ProjectOverviewDirection = {
  summary: string;
  nextConversationAction: string;
  evidenceHref: string;
};

export type HomepageProjection = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryStats: HomepageStat[];
  stageStats: HomepageStageStat[];
  decision: HomepageDecision;
  routes: HomeEntryLink[];
};

export type CockpitRuntimeSignal = {
  label: string;
  status: string;
  summary: string;
  href: string;
};

export type DemandStage = "thinking" | "planning" | "ready" | "doing" | "acceptance" | "released";

export type DemandStageItem = {
  id: string;
  title: string;
  source: string;
  stage: DemandStage;
  summary: string;
  nextConversationAction: string;
  evidenceHref: string;
  taskId?: string;
  badge?: string;
};

export type RuntimeFacts = {
  summary: string;
  blockedItems: string[];
  nextCheckpoint: string[];
  runtimeSignals: CockpitRuntimeSignal[];
  frozenItems: string[];
  pendingDevSummary: string;
  activeReleaseId: string | null;
};

export type ProjectOverviewSnapshot = {
  overview: ProjectOverviewSummary;
  direction: ProjectOverviewDirection;
  homepage: HomepageProjection;
  thinkingItems: DemandStageItem[];
  planningItems: DemandStageItem[];
  readyItems: DemandStageItem[];
  doingItems: DemandStageItem[];
  acceptanceItems: DemandStageItem[];
  releasedItems: DemandStageItem[];
  runtimeFacts: RuntimeFacts;
};

export type ProjectCockpit = ProjectOverviewSnapshot;
