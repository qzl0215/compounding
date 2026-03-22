import { getRuntimeStatusExplanation, type LocalRuntimeStatus } from "@/modules/releases";
import type {
  CockpitCurrentFocus,
  CockpitExecutionStatus,
  CockpitIdentity,
  CockpitRiskBoard,
  CockpitRuntimeSignal,
} from "./types";

export function buildIdentitySnapshot(missionAndVision: Record<string, string>): CockpitIdentity {
  return {
    oneLiner: missionAndVision["使命"] ?? "项目一句话尚未写入主源。",
  };
}

export function buildCurrentFocus(
  currentPhase: string,
  currentPriority: string,
  currentMilestone: string,
  successCriteria: string[],
): CockpitCurrentFocus {
  return {
    currentPhase: currentPhase || "当前阶段尚未定义。",
    currentPriority: currentPriority || "当前优先级尚未定义。",
    currentMilestone: currentMilestone || "当前里程碑尚未定义。",
    successCriteria,
  };
}

export function buildExecutionStatus(
  currentMilestone: string,
  doingTaskCount: number,
  blockedItems: string[],
  nextCheckpoint: string[],
  runtimeSignals: CockpitRuntimeSignal[],
): CockpitExecutionStatus {
  const progressSummary = doingTaskCount > 0
    ? `当前有 ${doingTaskCount} 项任务在推进，首页只保留最需要人工判断的状态与入口。`
    : "当前没有标记为进行中的任务，建议先确认下一步是否需要补 task 或重排优先级。";

  return {
    summary: `${progressSummary} 运行态摘要和下一检查点会一起展示，避免人只看任务不看环境。`,
    blockedItems,
    nextCheckpoint,
    runtimeSignals,
  };
}

export function buildRiskBoard(
  frozenItems: string[],
  pendingDevReleaseId: string | null,
  activeReleaseId: string | null,
): CockpitRiskBoard {
  const pendingDevSummary = pendingDevReleaseId
    ? `当前存在待验收 dev：${pendingDevReleaseId}。继续推进新改动前，建议先完成这轮验收判断。`
    : activeReleaseId
      ? `当前没有待验收 dev。已激活的 production 版本是 ${activeReleaseId}。`
      : "当前没有待验收 dev，也还没有激活的 production 版本。";

  return {
    frozenItems,
    pendingDevSummary,
  };
}

export function toRuntimeSignal(label: string, runtime: LocalRuntimeStatus): CockpitRuntimeSignal {
  const exp = getRuntimeStatusExplanation(runtime.status, label, runtime);
  const summary =
    exp.tone === "stable" ? exp.explanation : `${exp.explanation} 下一步：${exp.nextStep}`;
  return {
    label,
    status: exp.humanLabel,
    summary,
    href: "/releases#runtime-status",
  };
}
