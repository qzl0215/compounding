export type HomeEntryLink = {
  href: string;
  label: string;
  description: string;
  scope: "agents" | "roadmap" | "memory" | "tasks" | "release";
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

export type HomeLogicNodeState = "active" | "warning" | "healthy" | "complete";

export type HomeLogicNodeId = "goals" | "plan" | "execution" | "acceptance" | "focus";

export type HomeLogicNode = {
  id: HomeLogicNodeId;
  label: string;
  href: string;
  summary: string;
  state: HomeLogicNodeState;
  badge?: string;
};

export type HomeLogicEdge = {
  from: HomeLogicNodeId;
  to: HomeLogicNodeId;
};

export type HomeLogicMapSnapshot = {
  identity: {
    name: string;
    oneLiner: string;
  };
  headline: {
    overallSummary: string;
    currentPhase: string;
    currentMilestone: string;
  };
  success: {
    criteria: string[];
  };
  logicMap: {
    nodes: HomeLogicNode[];
    edges: HomeLogicEdge[];
    activeNodeId: HomeLogicNodeId;
  };
  attention: {
    blockers: string[];
    pendingAcceptance: string | null;
    runtimeAlert: string | null;
    healthSummary: string;
  };
};
