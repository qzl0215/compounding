import type { HarnessLiveSnapshot } from "@/modules/harness";
import type { ReleaseDashboard } from "@/modules/releases";
import type { ReleaseTaskOption } from "@/modules/releases";
import type { TaskCard, TaskDeliveryRow } from "@/modules/tasks";

export type DiffAwareCategory = {
  name: string;
  files: string[];
  risk: "low" | "medium" | "high";
  focus: string[];
  takeaway: string;
};

export type DiffAwareCheckLayer = {
  id: "static" | "build" | "runtime" | "ai-output";
  title: string;
  summary: string;
  commands: string[];
  runWhen: string;
  failureMeaning: string;
  nextStep: string;
};

export type SelectedDiffAwareCheck = DiffAwareCheckLayer & {
  reason: string;
};

export type SelectedChecks = {
  required: SelectedDiffAwareCheck[];
  recommended: SelectedDiffAwareCheck[];
};

export type DiffAwareArtifact = {
  state: "clean" | "dirty";
  summary: string;
  scopeSummary: string;
  reviewSummary: string;
  retroSummary: string;
  shipLog: string[];
  suggestedChecks: DiffAwareCheckLayer[];
  selectedChecks: SelectedChecks;
  retirementSuggestions: string[];
  evidencePoints: string[];
  nextActions: string[];
  changedFiles: string[];
  categories: DiffAwareCategory[];
  healthScore: {
    score: number;
    grade: string;
    reason: string;
  };
  stats: {
    files: number;
    insertions: number;
    deletions: number;
  };
};

export type DeliveryFacts = {
  harness: HarnessLiveSnapshot;
  taskCards: TaskCard[];
  releaseDashboard: ReleaseDashboard;
  diffAware: DiffAwareArtifact;
};

export type DeliveryProjections = {
  taskRows: TaskDeliveryRow[];
  taskOptions: ReleaseTaskOption[];
};

export type DeliverySnapshot = {
  facts: DeliveryFacts;
  projections: DeliveryProjections;
};
