import fs from "node:fs";
import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";
import { readDoc } from "@/modules/docs";
import { getDeliverySnapshot, type DeliverySnapshot } from "@/modules/delivery";
import {
  AI_EFFICIENCY_SUPPORTED_PROFILES,
  buildAiEfficiencyDashboard,
  normalizeAiEfficiencyEvent,
} from "../../../../../shared/ai-efficiency";
import { buildProjectJudgementContract } from "../../../../../shared/project-judgement";
import type { ProjectStateSnapshot } from "./types";

type AiEfficiencyDashboardOptions = Parameters<typeof buildAiEfficiencyDashboard>[1];
type ContextRetroReport = NonNullable<AiEfficiencyDashboardOptions>["contextRetroReport"];

export async function getProjectStateSnapshot(input?: { deliverySnapshot?: DeliverySnapshot }): Promise<ProjectStateSnapshot> {
  const workspaceRoot = getWorkspaceRoot();
  const deliverySnapshot = input?.deliverySnapshot ?? (await getDeliverySnapshot());
  const [currentState, roadmap, blueprint] = await Promise.all([
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/roadmap.md"),
    readDoc("memory/project/operating-blueprint.md"),
  ]);

  const releaseDashboard = deliverySnapshot.facts.releaseDashboard;
  const taskRows = deliverySnapshot.projections.taskRows;
  const counts = {
    total: taskRows.length,
    ready: taskRows.filter((row) => row.deliveryStatus === "not_started").length,
    doing: taskRows.filter((row) => row.deliveryStatus === "in_progress").length,
    blocked: taskRows.filter((row) => row.deliveryStatus === "blocked").length,
    acceptance: taskRows.filter((row) => row.deliveryStatus === "pending_acceptance").length,
    released: taskRows.filter((row) => row.deliveryStatus === "released" || row.deliveryStatus === "rolled_back").length,
  };
  const pendingAcceptance =
    summarizePendingAcceptance(
    releaseDashboard.pending_dev_release?.release_id ?? null,
    taskRows.find((row) => row.deliveryStatus === "pending_acceptance")?.versionLabel ?? null
  );
  const runtimeAlert =
    summarizeRuntimeAlert(
    releaseDashboard.local_runtime.reason,
    releaseDashboard.local_runtime.status,
    releaseDashboard.local_preview.reason,
    releaseDashboard.local_preview.status,
    Boolean(releaseDashboard.pending_dev_release)
  );
  const judgement = buildProjectJudgementContract({
    currentStateContent: currentState.content,
    roadmapContent: roadmap.content,
    blueprintContent: blueprint.content,
    counts,
    release: {
      pendingAcceptance,
      runtimeAlert,
      activeReleaseId: releaseDashboard.local_runtime.runtime_release_id || releaseDashboard.active_release_id,
      runtimeRunning: releaseDashboard.local_runtime.status === "running",
    },
  });

  return {
    identity: {
      name: path.basename(workspaceRoot),
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
    aiEfficiency: {
      dashboard: getAiEfficiencyDashboard(workspaceRoot, taskRows.map((row) => row.cost)),
    },
    activeStage: judgement.activeStage,
    judgement,
  };
}

function summarizePendingAcceptance(pendingReleaseId: string | null, acceptanceVersionLabel: string | null) {
  if (pendingReleaseId) return `待验收版本 ${pendingReleaseId}`;
  if (acceptanceVersionLabel) return `${acceptanceVersionLabel} 待验收`;
  return null;
}

function summarizeRuntimeAlert(
  prodReason: string,
  prodStatus: string,
  devReason: string,
  devStatus: string,
  hasPendingAcceptance: boolean,
) {
  if (prodStatus !== "running") return `production 异常：${prodReason}`;
  if (hasPendingAcceptance && devStatus !== "running") return `dev 预览异常：${devReason}`;
  return null;
}

function getAiEfficiencyDashboard(workspaceRoot: string, taskCostLedgers: DeliverySnapshot["projections"]["taskRows"][number]["cost"][]) {
  const contextRetroReport = readContextRetroReport(workspaceRoot);
  const eventsPath = path.join(workspaceRoot, "output", "ai", "command-gain", "events.jsonl");
  if (!fs.existsSync(eventsPath)) {
    return buildAiEfficiencyDashboard([], {
      contextRetroReport,
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
