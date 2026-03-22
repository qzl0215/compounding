import { getRuntimeStatusExplanation, type LocalRuntimeStatus } from "@/modules/releases";
import type {
  CockpitRuntimeSignal,
  HomepageProjection,
  ProjectOverviewDirection,
  ProjectOverviewSnapshot,
  ProjectOverviewSummary,
  RuntimeFacts,
} from "./types";

export function buildOverviewSummary(
  missionAndVision: Record<string, string>,
  currentPhase: string,
  currentMilestone: string,
  currentPriority: string,
): ProjectOverviewSummary {
  return {
    oneLiner: missionAndVision["使命"] ?? "项目一句话尚未写入主源。",
    currentPhase: currentPhase || "当前阶段尚未定义。",
    currentMilestone: currentMilestone || "当前里程碑尚未定义。",
    currentPriority: currentPriority || "当前优先级尚未定义。",
  };
}

export function buildDirectionSummary(summary: string): ProjectOverviewDirection {
  return {
    summary: summary || "下一阶段方向尚未写入。",
    nextConversationAction: "先问范围、范围外、取舍、优先级和验收标准。",
    evidenceHref: "/knowledge-base?path=memory/project/roadmap.md",
  };
}

export function buildRuntimeFacts(
  pendingDevSummary: string,
  activeReleaseId: string | null,
  blockedItems: string[],
  nextCheckpoint: string[],
  frozenItems: string[],
  runtimeSignals: CockpitRuntimeSignal[],
): RuntimeFacts {
  const summary = pendingDevSummary.includes("待验收版本")
    ? "先看待验收，再决定是否继续推进。"
    : activeReleaseId
      ? `当前 production 已上线 ${activeReleaseId}。`
      : "当前还没有 production 版本。";
  return {
    summary,
    blockedItems,
    nextCheckpoint,
    runtimeSignals,
    frozenItems,
    pendingDevSummary,
    activeReleaseId,
  };
}

export function toRuntimeSignal(label: string, runtime: LocalRuntimeStatus): CockpitRuntimeSignal {
  const exp = getRuntimeStatusExplanation(runtime.status, label, runtime);
  const summary =
    runtime.status === "running" && runtime.runtime_release_id
      ? `在线：${runtime.runtime_release_id}`
      : runtime.status === "stopped"
        ? "当前未启动"
        : runtime.status === "drift"
          ? "版本与 current 不一致"
          : runtime.status === "unmanaged"
            ? "端口被非托管进程占用"
            : runtime.status === "stale_pid"
              ? "记录中的进程已失效"
              : runtime.status === "port_error"
                ? "端口或状态异常"
                : exp.explanation;
  return {
    label,
    status: exp.humanLabel,
    summary,
    href: "/releases#runtime-status",
  };
}

export function buildHomepageProjection(snapshot: Pick<
  ProjectOverviewSnapshot,
  "overview" | "direction" | "thinkingItems" | "planningItems" | "readyItems" | "doingItems" | "acceptanceItems"
>): HomepageProjection {
  return {
    eyebrow: "需求总览",
    headline: "先定阶段，再定动作",
    subheadline: "先判断是待思考、待规划、待执行还是待验收，再决定讨论、建 task 或发布。",
    primaryStats: [
      { label: "当前阶段", value: snapshot.overview.currentPhase },
      { label: "当前里程碑", value: snapshot.overview.currentMilestone },
      { label: "下一方向", value: snapshot.direction.summary },
    ],
    stageStats: [
      { label: "待思考", value: String(snapshot.thinkingItems.length) },
      { label: "待规划", value: String(snapshot.planningItems.length) },
      { label: "待执行", value: String(snapshot.readyItems.length) },
      { label: "执行中", value: String(snapshot.doingItems.length) },
      { label: "待验收", value: String(snapshot.acceptanceItems.length) },
    ],
    sectionHints: {
      thinking: "先定义问题，不开工",
      planning: "先收口边界，再定方案",
      execution: "只展示真正可执行的事项",
      acceptance: "先完成验收，再继续推进",
    },
  };
}
