export type HomeEntryLink = {
  href: string;
  label: string;
  scope: "agents" | "roadmap" | "memory" | "tasks";
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
  currentPhase: string;
  successDefinition: string;
  mustProtect: string[];
};

export type BattleBoard = {
  currentPriority: string;
  currentFocus: string[];
  currentMainline: string;
  doingTasks: TaskSummary[];
  blockedTasks: TaskSummary[];
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

export type OrgRoleGroup = {
  title: string;
  roles: OrgRoleCard[];
};

export type SystemCard = {
  title: string;
  summary: string;
  href: string;
};

export type OnboardingStep = {
  title: string;
  summary: string;
  href: string;
};

export type PortalOverview = {
  homeLinks: HomeEntryLink[];
  company: CompanySnapshot;
  battle: BattleBoard;
  org: OrgRoleGroup[];
  systems: SystemCard[];
  onboarding: OnboardingStep[];
  risks: SystemCard[];
};
