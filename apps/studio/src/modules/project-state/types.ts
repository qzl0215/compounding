import type { ProjectJudgementContract } from "../../../../../shared/project-judgement";
import type { AiEfficiencyDashboard } from "../../../../../shared/ai-efficiency";
import type { GithubSurfaceReadinessReport } from "../../../../../shared/github-surface";

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
      planning: number;
      ready: number;
      doing: number;
      blocked: number;
      acceptance: number;
      released: number;
    };
    cleanup: {
      scheduled: number;
      failed: number;
      overdue: number;
      legacy: number;
      alert: string | null;
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
  githubSurface: GithubSurfaceReadinessReport;
  aiEfficiency: {
    dashboard: AiEfficiencyDashboard;
  };
  activeStage: ProjectStateStage;
  judgement: ProjectJudgementContract;
};

export type { ProjectJudgementContract, ProjectJudgementStage } from "../../../../../shared/project-judgement";
export type { AiEfficiencyDashboard } from "../../../../../shared/ai-efficiency";
export type { GithubSurfaceReadinessReport, GithubSurfaceReadinessStep } from "../../../../../shared/github-surface";
