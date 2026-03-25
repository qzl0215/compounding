export type ProjectStateStage = "thinking" | "planning" | "ready" | "doing" | "acceptance" | "released";

export type ProjectStateSnapshot = {
  identity: {
    name: string;
    oneLiner: string;
  };
  headline: {
    overallSummary: string;
    currentPhase: string;
    currentMilestone: string;
    currentPriority: string;
  };
  success: {
    criteria: string[];
  };
  plan: {
    overview: string;
    thinkingBacklog: string[];
    planningBacklog: string[];
    summary: string;
  };
  execution: {
    summary: string;
    counts: {
      total: number;
      ready: number;
      doing: number;
      blocked: number;
      acceptance: number;
      released: number;
    };
  };
  focus: {
    current: string[];
    blockers: string[];
    nextCheckpoint: string[];
    summary: string;
  };
  release: {
    activeReleaseId: string | null;
    pendingAcceptance: string | null;
    runtimeAlert: string | null;
    healthSummary: string;
    conclusion: string;
    nextAction: string;
  };
  activeStage: ProjectStateStage;
};
