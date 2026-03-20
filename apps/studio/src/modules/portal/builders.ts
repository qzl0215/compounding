import { getRuntimeStatusExplanation, type LocalRuntimeStatus } from "@/modules/releases";
import { TASK_STATUS_LABELS } from "@/modules/tasks";
import type {
  CockpitCurrentFocus,
  CockpitExecutionStatus,
  CockpitIdentity,
  CockpitRiskBoard,
  CockpitRiskItem,
  CockpitRiskTone,
  CockpitRuntimeSignal,
  TaskSummary,
} from "./types";

export function buildIdentitySnapshot(
  missionAndVision: Record<string, string>,
  successDefinition: string,
  mustProtect: string[],
): CockpitIdentity {
  return {
    oneLiner: missionAndVision["使命"] ?? "项目一句话尚未写入主源。",
    mission: missionAndVision["使命"] || "使命尚未定义。",
    successDefinition: successDefinition || "成功定义尚未定义。",
    mustProtect,
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
  doingTasks: TaskSummary[],
  blockedItems: string[],
  nextCheckpoint: string[],
  runtimeSignals: CockpitRuntimeSignal[],
): CockpitExecutionStatus {
  const progressSummary = doingTasks.length
    ? `当前有 ${doingTasks.length} 项任务在推进，首页默认展示最需要人工继续跟进的事项。`
    : "当前没有标记为进行中的任务，建议先确认下一步是否需要补 task 或重排优先级。";

  return {
    headline: currentMilestone || "当前推进主线尚未定义。",
    summary: `${progressSummary} 运行态摘要和下一检查点会一起展示，避免人只看任务不看环境。`,
    doingTasks,
    blockedItems,
    nextCheckpoint,
    runtimeSignals,
  };
}

export function buildRiskBoard(
  factConflicts: string[],
  frozenItems: string[],
  pendingDevReleaseId: string | null,
  activeReleaseId: string | null,
  previewRuntime: LocalRuntimeStatus,
  productionRuntime: LocalRuntimeStatus,
): CockpitRiskBoard {
  const pendingDevSummary = pendingDevReleaseId
    ? `当前存在待验收 dev：${pendingDevReleaseId}。继续推进新改动前，建议先完成这轮验收判断。`
    : activeReleaseId
      ? `当前没有待验收 dev。已激活的 production 版本是 ${activeReleaseId}。`
      : "当前没有待验收 dev，也还没有激活的 production 版本。";

  return {
    factConflicts,
    frozenItems,
    pendingDevSummary,
    items: [
      {
        title: "待验收版本",
        summary: pendingDevSummary,
        tone: pendingDevReleaseId ? "warning" : "stable",
        href: "/releases",
      },
      toRuntimeRiskItem("dev 预览", previewRuntime),
      toRuntimeRiskItem("production", productionRuntime),
    ],
  };
}

export function toTaskSummary(task: {
  title: string;
  goal: string;
  status: string;
  path: string;
  relatedModules: string[];
  updateTrace: { memory: string; index: string; roadmap: string; docs: string };
}): TaskSummary {
  return {
    title: task.title,
    goal: task.goal,
    status: TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] ?? task.status,
    path: task.path,
    relatedModules: task.relatedModules,
    updateTrace: summarizeTaskTrace(task),
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

function summarizeTaskTrace(task: { updateTrace: { memory: string; index: string; roadmap: string; docs: string } }) {
  return [task.updateTrace.memory, task.updateTrace.index, task.updateTrace.roadmap, task.updateTrace.docs]
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");
}

function toRuntimeRiskItem(label: string, runtime: LocalRuntimeStatus): CockpitRiskItem {
  const exp = getRuntimeStatusExplanation(runtime.status, label, runtime);
  const summary =
    exp.tone === "stable" ? exp.explanation : `${exp.explanation} 下一步：${exp.nextStep}`;
  return {
    title: `${label} 运行态`,
    summary,
    tone: exp.tone,
    href: "/releases#runtime-status",
  };
}
