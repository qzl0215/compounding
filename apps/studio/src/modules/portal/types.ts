export type HomeEntryLink = {
  href: string;
  label: string;
  scope: "agents" | "roadmap" | "memory";
};

export type SemanticEntry = {
  label: string;
  path: string;
  description: string;
};

export type SemanticEntryGroup = {
  title: string;
  description: string;
  items: SemanticEntry[];
};

export type TaskSummary = {
  title: string;
  goal: string;
  status: string;
  path: string;
};

export type OverviewSnippet = {
  label: string;
  path: string;
  content: string;
};

export type PortalOverview = {
  projectIntro: string | null;
  currentFocus: string | null;
  roadmap: string;
  tasks: TaskSummary[];
  memory: OverviewSnippet[];
  index: OverviewSnippet[];
  roleOverview: string | null;
};
