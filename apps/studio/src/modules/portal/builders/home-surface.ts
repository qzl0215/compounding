import { getRuntimeStatusExplanation, type LocalRuntimeStatus } from "@/modules/releases";
import type {
  CockpitRuntimeSignal,
  KernelShellArtifacts,
  OverviewEntry,
  ProjectOverviewDirection,
  ProjectOverviewSnapshot,
  ProjectOverviewSummary,
  RuntimeFacts,
} from "../types";
import { buildKernelTabSnapshot } from "./kernel-tab";
import { buildProjectTabSnapshot } from "./project-tab";

type SurfaceSnapshotInput = {
  workspaceLabel: string;
  workspacePath: string;
  overview: ProjectOverviewSummary;
  direction: ProjectOverviewDirection;
  runtimeFacts: RuntimeFacts;
  kernelArtifacts: KernelShellArtifacts;
  drilldowns: OverviewEntry[];
};

export function buildOverviewSummary(
  oneLiner: string,
  currentPhase: string,
  currentMilestone: string,
  currentPriority: string,
): ProjectOverviewSummary {
  return {
    oneLiner: oneLiner || "项目一句话尚未写入主源。",
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

export function buildHomeSurfaceSnapshot({
  workspaceLabel,
  workspacePath,
  overview,
  direction,
  runtimeFacts,
  kernelArtifacts,
  drilldowns,
}: SurfaceSnapshotInput): Pick<ProjectOverviewSnapshot, "header" | "defaultTab" | "kernel" | "project"> {
  return {
    header: {
      eyebrow: "首页入口",
      title: "Kernel / Project",
      description: "先看可复用内核，再看当前项目的接入状态与执行态势。",
      workspaceLabel,
      workspacePath,
    },
    defaultTab: "project",
    kernel: buildKernelTabSnapshot(workspaceLabel, kernelArtifacts),
    project: buildProjectTabSnapshot(overview, direction, runtimeFacts, kernelArtifacts, drilldowns),
  };
}
