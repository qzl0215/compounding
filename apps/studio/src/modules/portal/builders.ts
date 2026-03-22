import { getRuntimeStatusExplanation, type LocalRuntimeStatus } from "@/modules/releases";
import type {
  CockpitRuntimeSignal,
  HomeEntryLink,
  HomepageProjection,
  ProjectOverviewDirection,
  ProjectOverviewSnapshot,
  ProjectOverviewSummary,
  RuntimeFacts,
} from "./types";

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

export function buildHomepageProjection(
  snapshot: Pick<
    ProjectOverviewSnapshot,
    | "overview"
    | "direction"
    | "thinkingItems"
    | "planningItems"
    | "readyItems"
    | "doingItems"
    | "acceptanceItems"
    | "runtimeFacts"
  >,
  routes: HomeEntryLink[],
): HomepageProjection {
  const topBlocked = snapshot.runtimeFacts.blockedItems[0];
  const topThinking = snapshot.thinkingItems[0];
  const topPlanning = snapshot.planningItems[0];
  const topAcceptance = snapshot.acceptanceItems[0];
  const topReady = snapshot.readyItems[0];
  const topDoing = snapshot.doingItems[0];
  const topCheckpoint = snapshot.runtimeFacts.nextCheckpoint[0];
  const decision = topAcceptance
    ? {
        title: "当前先验收",
        summary: `当前已有待验收事项。先完成 ${topAcceptance.title} 的验收判断，再决定下一轮动作。`,
        evidenceHref: "/releases",
        ctaLabel: "去发布页判断",
        badge: snapshot.runtimeFacts.pendingDevSummary,
      }
    : topDoing
      ? {
          title: "当前先推进",
          summary: `当前有执行中事项。先处理推进与阻塞：${topBlocked || topDoing.summary}`,
          evidenceHref: topBlocked ? "/releases#runtime-status" : "/tasks",
          ctaLabel: topBlocked ? "看运行与阻塞" : "看执行面板",
          badge: `${snapshot.doingItems.length} 条执行中`,
        }
      : topReady
        ? {
            title: "当前可执行",
            summary: `当前有已具备边界的事项。先推进 ${topReady.title} 这类 task，不再停留在泛化讨论。`,
            evidenceHref: "/tasks",
            ctaLabel: "去执行面板",
            badge: `${snapshot.readyItems.length} 条待执行`,
          }
        : topPlanning
          ? {
              title: "当前先收边界",
              summary: `像“${topPlanning.title}”这类事项仍在待规划。先定范围外、取舍和体验验收标准。`,
              evidenceHref: topPlanning.evidenceHref,
              ctaLabel: "看计划主源",
              badge: `${snapshot.planningItems.length} 条待规划`,
            }
          : topThinking
            ? {
                title: "当前先扩选项",
                summary: `像“${topThinking.title}”这类事项仍在待思考。先把问题、价值、时机和替代方案问清。`,
                evidenceHref: topThinking.evidenceHref,
                ctaLabel: "回主源补问题",
                badge: `${snapshot.thinkingItems.length} 条待思考`,
              }
            : {
                title: "当前主线稳定",
                summary: topCheckpoint || snapshot.direction.nextConversationAction,
                evidenceHref: snapshot.direction.evidenceHref,
                ctaLabel: "看路线图",
              };

  return {
    eyebrow: "需求总览",
    headline: "先扩选项，再收决策",
    subheadline: "单层 Plan 只在 operating-blueprint 收口。边界没清前，不进 task；结果未验收前，不继续堆改动。",
    primaryStats: [
      { label: "当前阶段", value: snapshot.overview.currentPhase },
      { label: "当前里程碑", value: snapshot.overview.currentMilestone },
      { label: "当前优先级", value: snapshot.overview.currentPriority },
      { label: "下一方向", value: snapshot.direction.summary },
    ],
    stageStats: [
      { label: "待思考", value: String(snapshot.thinkingItems.length), hint: "先补问题" },
      { label: "待规划", value: String(snapshot.planningItems.length), hint: "先收边界" },
      { label: "待执行", value: String(snapshot.readyItems.length), hint: "可进 task" },
      { label: "执行中", value: String(snapshot.doingItems.length), hint: "看推进" },
      { label: "待验收", value: String(snapshot.acceptanceItems.length), hint: "先判断" },
    ],
    decision,
    routes,
  };
}
