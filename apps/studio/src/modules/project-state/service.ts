import fs from "node:fs";
import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";
import { getDeliverySnapshot, type DeliverySnapshot } from "@/modules/delivery";
import {
  AI_EFFICIENCY_SUPPORTED_PROFILES,
  buildAiEfficiencyDashboard,
  normalizeAiEfficiencyEvent,
} from "../../../../../shared/ai-efficiency";
import { resolveGitCommonRoot } from "../../../../../shared/git-workspace";
import { getGithubSurfaceReadiness } from "../../../../../shared/github-surface-runtime";
import {
  buildLiveProjectJudgementContract,
  buildProjectJudgementReleaseFacts,
  summarizeProjectJudgementCounts,
} from "../../../../../shared/project-judgement-live";
import type { ProjectStateSnapshot } from "./types";

type AiEfficiencyDashboardOptions = Parameters<typeof buildAiEfficiencyDashboard>[1];
type ContextRetroReport = NonNullable<AiEfficiencyDashboardOptions>["contextRetroReport"];
type LearningCandidatesReport = NonNullable<AiEfficiencyDashboardOptions>["learningCandidatesReport"];

export async function getProjectStateSnapshot(input?: { deliverySnapshot?: DeliverySnapshot }): Promise<ProjectStateSnapshot> {
  const workspaceRoot = getWorkspaceRoot();
  const deliverySnapshot = input?.deliverySnapshot ?? (await getDeliverySnapshot());

  const releaseDashboard = deliverySnapshot.facts.releaseDashboard;
  const taskRows = deliverySnapshot.projections.taskRows;
  const counts = summarizeProjectJudgementCounts(
    taskRows.map((row) => ({
      stateId: row.machine.stateId,
      deliveryStatus: row.deliveryStatus,
    })),
  );
  const cleanup = {
    scheduled: taskRows.filter((row) => row.machine.branchCleanup?.overallState === "scheduled").length,
    failed: taskRows.filter((row) => row.machine.branchCleanup?.overallState === "failed").length,
    overdue: taskRows.filter((row) => row.machine.branchCleanup?.isOverdue).length,
    legacy: taskRows.filter((row) => isLegacyCleanupBacklog(row)).length,
  };
  const cleanupAlert =
    cleanup.failed > 0 || cleanup.overdue > 0 || cleanup.legacy > 0
      ? `分支治理：待回收 ${cleanup.scheduled} / 失败 ${cleanup.failed} / 逾期 ${cleanup.overdue} / 历史残留 ${cleanup.legacy}`
      : null;
  const releaseFacts = buildProjectJudgementReleaseFacts({
    pendingReleaseId: releaseDashboard.pending_dev_release?.release_id ?? null,
    acceptanceVersionLabel: taskRows.find((row) => row.deliveryStatus === "pending_acceptance")?.versionLabel ?? null,
    prodRuntime: {
      reason: releaseDashboard.local_runtime.reason,
      status: releaseDashboard.local_runtime.status,
      runtimeReleaseId: releaseDashboard.local_runtime.runtime_release_id,
    },
    devRuntime: {
      reason: releaseDashboard.local_preview.reason,
      status: releaseDashboard.local_preview.status,
      runtimeReleaseId: releaseDashboard.local_preview.runtime_release_id,
    },
    activeReleaseId: releaseDashboard.active_release_id,
  });
  const judgement = buildLiveProjectJudgementContract(workspaceRoot, {
    counts,
    release: releaseFacts,
  });
  const githubSurface = getGithubSurfaceReadiness(workspaceRoot);

  return {
    identity: {
      name: path.basename(resolveGitCommonRoot(workspaceRoot)),
      oneLiner: judgement.oneLiner,
    },
    headline: {
      overallSummary: judgement.overallSummary,
      currentPhase: judgement.currentPhase,
      currentMilestone: judgement.currentMilestone,
      currentPriority: judgement.currentPriority,
    },
    success: {
      criteria: judgement.successCriteria,
    },
    plan: {
      overview: judgement.planOverview,
      thinkingBacklog: judgement.thinkingBacklog,
      planningBacklog: judgement.planningBacklog,
      summary: judgement.planSummary,
    },
    execution: {
      summary: judgement.executionSummary,
      counts,
      cleanup: {
        ...cleanup,
        alert: cleanupAlert,
      },
    },
    focus: {
      current: judgement.currentFocus,
      blockers: judgement.blockers,
      nextCheckpoint: judgement.nextCheckpoint,
      summary: judgement.focusSummary,
    },
    release: {
      activeReleaseId: releaseDashboard.active_release_id,
      pendingAcceptance: judgement.pendingAcceptance,
      runtimeAlert: judgement.runtimeAlert,
      healthSummary: judgement.healthSummary,
      conclusion: judgement.conclusion,
      nextAction: judgement.nextAction,
    },
    githubSurface,
    aiEfficiency: {
      dashboard: getAiEfficiencyDashboard(workspaceRoot, taskRows.map((row) => row.cost)),
    },
    activeStage: judgement.activeStage,
    judgement,
  };
}

function isLegacyCleanupBacklog(row: DeliverySnapshot["projections"]["taskRows"][number]) {
  return Boolean(
    !row.machine.branchCleanup &&
      row.status === "done" &&
      row.machine.git.state === "merged" &&
      row.machine.branch &&
      !row.machine.branch.startsWith("main"),
  );
}

function getAiEfficiencyDashboard(workspaceRoot: string, taskCostLedgers: DeliverySnapshot["projections"]["taskRows"][number]["cost"][]) {
  const contextRetroReport = readContextRetroReport(workspaceRoot);
  const learningCandidatesReport = readLearningCandidatesReport(workspaceRoot);
  const eventsPath = path.join(workspaceRoot, "output", "ai", "command-gain", "events.jsonl");
  if (!fs.existsSync(eventsPath)) {
    return buildAiEfficiencyDashboard([], {
      contextRetroReport,
      learningCandidatesReport,
      supportedProfiles: AI_EFFICIENCY_SUPPORTED_PROFILES,
      taskCostLedgers,
    });
  }

  const events = fs
    .readFileSync(eventsPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return normalizeAiEfficiencyEvent(JSON.parse(line));
      } catch {
        return null;
      }
    })
    .filter((event): event is ReturnType<typeof normalizeAiEfficiencyEvent> => Boolean(event));

  return buildAiEfficiencyDashboard(events, {
    supportedProfiles: AI_EFFICIENCY_SUPPORTED_PROFILES,
    contextRetroReport,
    learningCandidatesReport,
    taskCostLedgers,
  });
}

function readContextRetroReport(workspaceRoot: string): ContextRetroReport {
  const jsonPath = path.join(workspaceRoot, "output", "ai", "context-retro", "latest.json");
  if (!fs.existsSync(jsonPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf8")) as ContextRetroReport;
  } catch {
    return null;
  }
}

function readLearningCandidatesReport(workspaceRoot: string): LearningCandidatesReport {
  const jsonPath = path.join(workspaceRoot, "output", "ai", "learning-candidates", "latest.json");
  if (!fs.existsSync(jsonPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(jsonPath, "utf8")) as LearningCandidatesReport;
  } catch {
    return null;
  }
}
