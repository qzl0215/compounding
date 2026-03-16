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

export type CompanySnapshot = {
  oneLiner: string;
  mission: string;
  vision: string;
  values: string[];
  successDefinition: string;
  mustProtect: string[];
};

export type RoadmapSnapshot = {
  currentPhase: string;
  currentPriority: string;
  nextMilestone: string;
  successCriteria: string[];
};

export type BlueprintGoal = {
  title: string;
  releaseStandards: string[];
  relatedTasks: string[];
};

export type BlueprintBoard = {
  currentMilestone: string;
  currentPriority: string;
  currentMainline: string;
  doingTasks: TaskSummary[];
  blockedItems: string[];
  goals: BlueprintGoal[];
  nextCheckpoint: string[];
};

export type OrgRoleCard = {
  name: string;
  mission: string;
  responsibilities: string[];
  outputs: string[];
  triggerMoments: string[];
  antiPatterns: string[];
};

export type WorkModeStep = {
  kind: "trigger" | "mode";
  name: string;
  summary: string;
  href: string;
};

export type OrgRoleGroup = {
  title: string;
  roles: OrgRoleCard[];
};

export type SystemCard = {
  title: string;
  summary: string;
  href: string;
};

export type PortalOverview = {
  homeLinks: HomeEntryLink[];
  identity: CompanySnapshot;
  roadmap: RoadmapSnapshot;
  blueprint: BlueprintBoard;
  workModeFlow: WorkModeStep[];
  org: OrgRoleGroup[];
  knowledgeRisk: SystemCard[];
};
