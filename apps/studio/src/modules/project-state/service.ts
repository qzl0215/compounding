import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";
import { extractSection, readDoc } from "@/modules/docs";
import { getDeliverySnapshot, type DeliverySnapshot } from "@/modules/delivery";
import { normalizeInline, parseBulletList } from "@/modules/portal/parsing";
import type { ProjectStateSnapshot, ProjectStateStage } from "./types";

export async function getProjectStateSnapshot(input?: { deliverySnapshot?: DeliverySnapshot }): Promise<ProjectStateSnapshot> {
  const workspaceRoot = getWorkspaceRoot();
  const deliverySnapshot = input?.deliverySnapshot ?? (await getDeliverySnapshot());
  const [currentState, roadmap, blueprint] = await Promise.all([
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/roadmap.md"),
    readDoc("memory/project/operating-blueprint.md"),
  ]);

  const currentFocus = parseBulletList(extractSection(currentState.content, "current_focus") ?? "");
  const currentBlockers = summarizeBlockers(parseBulletList(extractSection(currentState.content, "current_blockers") ?? ""));
  const nextCheckpoint = parseBulletList(extractSection(currentState.content, "next_checkpoint") ?? "");
  const currentPhase = normalizeInline(extractSection(roadmap.content, "current_phase") ?? "");
  const currentPriority = normalizeInline(extractSection(roadmap.content, "current_priority") ?? "");
  const currentMilestone = normalizeInline(extractSection(roadmap.content, "current_milestone") ?? currentPhase);
  const successCriteria = parseBulletList(extractSection(roadmap.content, "milestone_success_criteria") ?? "");
  const planOverview = normalizeInline(extractSection(blueprint.content, "plan_overview") ?? "");
  const thinkingBacklog = parseBulletList(extractSection(blueprint.content, "thinking_backlog") ?? "");
  const planningBacklog = parseBulletList(extractSection(blueprint.content, "planning_backlog") ?? "");

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
  const pendingAcceptance = summarizePendingAcceptance(
    releaseDashboard.pending_dev_release?.release_id ?? null,
    taskRows.find((row) => row.deliveryStatus === "pending_acceptance")?.versionLabel ?? null
  );
  const runtimeAlert = summarizeRuntimeAlert(
    releaseDashboard.local_runtime.reason,
    releaseDashboard.local_runtime.status,
    releaseDashboard.local_preview.reason,
    releaseDashboard.local_preview.status,
    Boolean(releaseDashboard.pending_dev_release)
  );

  return {
    identity: {
      name: path.basename(workspaceRoot),
      oneLiner: summarizeOneLiner(planOverview, currentPriority, currentMilestone),
    },
    headline: {
      overallSummary: summarizeHeadline(currentFocus, currentPriority, planOverview, pendingAcceptance, runtimeAlert),
      currentPhase: currentPhase || "当前阶段尚未定义。",
      currentMilestone: currentMilestone || "当前里程碑尚未定义。",
      currentPriority: currentPriority || "当前优先级尚未定义。",
    },
    success: {
      criteria: summarizeSuccessCriteria(successCriteria, currentPriority, currentMilestone, planOverview),
    },
    plan: {
      overview: planOverview,
      thinkingBacklog,
      planningBacklog,
      summary: summarizePlan(planOverview, planningBacklog, thinkingBacklog),
    },
    execution: {
      summary: summarizeExecution(counts.doing, counts.ready),
      counts,
    },
    focus: {
      current: currentFocus,
      blockers: currentBlockers,
      nextCheckpoint,
      summary: summarizeFocus(currentFocus, nextCheckpoint, currentPriority),
    },
    release: {
      activeReleaseId: releaseDashboard.active_release_id,
      pendingAcceptance,
      runtimeAlert,
      healthSummary: summarizeHealth(currentBlockers, pendingAcceptance, runtimeAlert),
      conclusion: summarizeReleaseConclusion(releaseDashboard, pendingAcceptance),
      nextAction: summarizeReleaseNextAction(releaseDashboard, pendingAcceptance),
    },
    activeStage: resolveProjectStateStage(thinkingBacklog, planningBacklog, counts, pendingAcceptance),
  };
}

function resolveProjectStateStage(
  thinkingBacklog: string[],
  planningBacklog: string[],
  counts: ProjectStateSnapshot["execution"]["counts"],
  pendingAcceptance: string | null,
): ProjectStateStage {
  if (pendingAcceptance || counts.acceptance > 0) return "acceptance";
  if (counts.doing > 0 || counts.blocked > 0) return "doing";
  if (counts.ready > 0) return "ready";
  if (planningBacklog.length > 0) return "planning";
  if (thinkingBacklog.length > 0) return "thinking";
  return "released";
}

function summarizePlan(planOverview: string, planningBacklog: string[], thinkingBacklog: string[]) {
  if (planningBacklog.length > 0 || thinkingBacklog.length > 0) {
    return `待规划 ${planningBacklog.length} 项，待思考 ${thinkingBacklog.length} 项。先收口边界，再进入执行。`;
  }
  return simplifyHumanSentence(planOverview) || "当前计划边界已收口，可继续看执行事项。";
}

function summarizeExecution(doingCount: number, readyCount: number) {
  if (doingCount > 0) {
    return `当前有 ${doingCount} 项在推进，细节看执行面板。`;
  }
  if (readyCount > 0) {
    return `当前有 ${readyCount} 项可开工，先看执行面板。`;
  }
  return "当前没有新的执行事项，先看计划边界或验收与运行。";
}

function summarizeFocus(currentFocus: string[], nextCheckpoint: string[], currentPriority: string) {
  return (
    simplifyHumanSentence(currentFocus[0]) ||
    simplifyHumanSentence(nextCheckpoint[0]) ||
    simplifyHumanSentence(currentPriority) ||
    "当前焦点尚未写入。"
  );
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

function summarizeHealth(blockers: string[], pendingAcceptance: string | null, runtimeAlert: string | null) {
  if (blockers.length > 0) return "当前有阻塞，先处理当前焦点和提醒。";
  if (pendingAcceptance) return "当前有待验收版本，先做判断再继续推进。";
  if (runtimeAlert) return "当前运行存在异常，先恢复运行态。";
  return "当前无待验收版本，运行正常，可继续按当前焦点推进。";
}

function summarizeReleaseConclusion(releaseDashboard: DeliverySnapshot["facts"]["releaseDashboard"], pendingAcceptance: string | null) {
  if (pendingAcceptance) {
    return "现在该验收，不该继续堆改动。";
  }
  if (releaseDashboard.local_runtime.status === "running") {
    return `当前 production 在线，运行版本 ${releaseDashboard.local_runtime.runtime_release_id || "未知"}。`;
  }
  return "当前先确认运行态，再讨论继续发布。";
}

function summarizeReleaseNextAction(releaseDashboard: DeliverySnapshot["facts"]["releaseDashboard"], pendingAcceptance: string | null) {
  if (pendingAcceptance) {
    return `先验收 ${releaseDashboard.pending_dev_release?.release_id || "当前版本"}，通过或驳回后再继续推进。`;
  }
  if (releaseDashboard.local_runtime.status === "running") {
    return "如需继续推进，先生成新的 dev 预览，再进入验收。";
  }
  return "先恢复运行态，再决定是否继续生成或切换 release。";
}

function summarizeOneLiner(planOverview: string, currentPriority: string, currentMilestone: string) {
  return (
    simplifyHumanSentence(currentPriority) ||
    simplifyHumanSentence(planOverview) ||
    simplifyHumanSentence(currentMilestone) ||
    "项目一句话目标尚未写入。"
  );
}

function summarizeHeadline(
  currentFocus: string[],
  currentPriority: string,
  planOverview: string,
  pendingAcceptance: string | null,
  runtimeAlert: string | null,
) {
  if (pendingAcceptance) return `${pendingAcceptance}，先完成验收判断。`;
  if (runtimeAlert) return runtimeAlert;
  return (
    simplifyHumanSentence(currentFocus[0]) ||
    simplifyHumanSentence(currentPriority) ||
    simplifyHumanSentence(planOverview) ||
    "当前焦点尚未写入。"
  );
}

function summarizeSuccessCriteria(successCriteria: string[], currentPriority: string, currentMilestone: string, planOverview: string) {
  const normalized = successCriteria
    .map((item) => normalizeSuccessCriterion(item))
    .filter((item): item is string => Boolean(item));
  if (normalized.length > 0) {
    return normalized.slice(0, 3);
  }
  const fallback = simplifyHumanSentence(currentPriority) || simplifyHumanSentence(currentMilestone) || simplifyHumanSentence(planOverview);
  return [fallback || "当前成功标准尚未写入。"];
}

function normalizeSuccessCriterion(value: string) {
  const text = simplifyHumanSentence(value);
  if (!text) return null;
  if (text.includes("首屏不滚动即可回答")) return "首屏能回答目标、阶段、风险和下一步";
  if (text.includes("逻辑结构图")) return "首页主视觉是可点击的逻辑结构图";
  if (text.includes("退出首页") || text.includes("不再")) return "首页不再平铺工程内部对象";
  if (text.includes("不新增新状态源") || text.includes("重型框架") || text.includes("图形库")) return null;
  return text;
}

function summarizeBlockers(blockers: string[]) {
  const normalized = blockers.map((item) => normalizeBlocker(item)).filter((item): item is string => Boolean(item));
  return Array.from(new Set(normalized));
}

function normalizeBlocker(value: string) {
  const text = normalizeInline(value).replace(/`/g, "");
  if (!text) return null;
  if (text.includes("没有发布阻塞")) return "新首页必须彻底脱离旧工程壳，不能只换一层文案。";
  if (text.includes("只换视觉") || text.includes("回流")) return "首页必须连同读模型一起收口，避免旧结构回流。";
  return simplifyHumanSentence(text);
}

function simplifyHumanSentence(value: string | null | undefined) {
  if (!value) return "";

  let text = normalizeInline(value).replace(/`/g, "");
  text = text.replace(/^t-\d+\s*(正在推进|已完成|仍在待续主线)?[:：]\s*/i, "");
  text = text.replace(/^当前主线切到\s*/u, "");
  text = text.replace(/Kernel\s*\/\s*Project/gi, "旧首页");
  text = text.replace(/\bold\b/gi, "旧");
  text = text.replace(/artifact health/gi, "工程状态");
  text = text.replace(/boundary groups/gi, "工程分组");
  text = text.replace(/\s+/g, " ").trim();

  if (text.includes("首页") && text.includes("逻辑态势图")) {
    return "把首页收成人类可扫读的项目逻辑态势图。";
  }

  return text.split(/[；。]/u).map((part) => part.trim()).find(Boolean) || text;
}
