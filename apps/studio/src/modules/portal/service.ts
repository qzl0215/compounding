import path from "node:path";
import { getWorkspaceRoot } from "@/lib/workspace";
import { extractSection, readDoc } from "@/modules/docs";
import { getDeliverySnapshot } from "@/modules/delivery";
import { buildHomeLogicMapSnapshot } from "./builders";
import { HOME_ENTRY_LINKS } from "./constants";
import { normalizeInline, parseBulletList } from "./parsing";
import { groupTaskRowsByDemandStage } from "./stage-model";
import type { DemandStage, HomeLogicMapSnapshot, SemanticEntry, SemanticEntryGroup } from "./types";

export { DEFAULT_DOC_PATH, HOME_ENTRY_LINKS } from "./constants";

export async function getHomeStatusBoard(): Promise<HomeLogicMapSnapshot> {
  const workspaceRoot = getWorkspaceRoot();
  const workspaceLabel = path.basename(workspaceRoot);

  const [currentState, roadmap, blueprint, deliverySnapshot] = await Promise.all([
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/roadmap.md"),
    readDoc("memory/project/operating-blueprint.md"),
    getDeliverySnapshot(),
  ]);

  const currentFocus = parseBulletList(extractSection(currentState.content, "current_focus") ?? "");
  const currentBlockers = parseBulletList(extractSection(currentState.content, "current_blockers") ?? "");
  const nextCheckpoint = parseBulletList(extractSection(currentState.content, "next_checkpoint") ?? "");
  const roadmapPhase = normalizeInline(extractSection(roadmap.content, "current_phase") ?? "");
  const currentPriority = normalizeInline(extractSection(roadmap.content, "current_priority") ?? "");
  const currentMilestone = normalizeInline(extractSection(roadmap.content, "current_milestone") ?? roadmapPhase);
  const successCriteria = parseBulletList(extractSection(roadmap.content, "milestone_success_criteria") ?? "");
  const blueprintOverview = normalizeInline(extractSection(blueprint.content, "plan_overview") ?? "");
  const thinkingBacklog = parseBulletList(extractSection(blueprint.content, "thinking_backlog") ?? "");
  const planningBacklog = parseBulletList(extractSection(blueprint.content, "planning_backlog") ?? "");

  const taskRows = deliverySnapshot.projections.taskRows;
  const releaseDashboard = deliverySnapshot.facts.releaseDashboard;
  const stageBuckets = groupTaskRowsByDemandStage(taskRows);
  const pendingAcceptance = summarizePendingAcceptance(releaseDashboard.pending_dev_release?.release_id ?? null, stageBuckets.acceptance[0]?.versionLabel ?? null);
  const runtimeAlert = summarizeRuntimeAlert(
    releaseDashboard.local_runtime.reason,
    releaseDashboard.local_runtime.status,
    releaseDashboard.local_preview.reason,
    releaseDashboard.local_preview.status,
    Boolean(releaseDashboard.pending_dev_release),
  );
  const activeStage = resolveHomeStage(thinkingBacklog, planningBacklog, stageBuckets, pendingAcceptance);
  const overallSummary = currentFocus[0] || currentPriority || blueprintOverview || "当前焦点尚未写入。";

  return buildHomeLogicMapSnapshot({
    name: workspaceLabel,
    oneLiner: blueprintOverview || currentPriority || "项目一句话目标尚未写入。",
    overallSummary,
    currentPhase: roadmapPhase || "当前阶段尚未定义。",
    currentMilestone: currentMilestone || "当前里程碑尚未定义。",
    successCriteria: successCriteria.length > 0 ? successCriteria : buildFallbackCriteria(currentPriority, blueprintOverview),
    activeStage,
    goals: {
      summary: summarizeGoals(currentPriority, currentMilestone, successCriteria),
      badge: roadmapPhase || "当前阶段",
    },
    plan: {
      summary: summarizePlan(blueprintOverview, planningBacklog, thinkingBacklog),
      badge: buildPlanBadge(planningBacklog.length, thinkingBacklog.length),
    },
    execution: {
      summary: summarizeExecution(stageBuckets.doing, stageBuckets.ready),
      badge: buildExecutionBadge(stageBuckets.doing.length, stageBuckets.ready.length),
    },
    acceptance: {
      summary: summarizeAcceptance(pendingAcceptance, runtimeAlert, releaseDashboard.active_release_id),
      badge: pendingAcceptance ? "待验收" : runtimeAlert ? "异常" : "稳定",
    },
    focus: {
      summary: summarizeFocus(currentFocus, nextCheckpoint, currentPriority),
      badge: currentBlockers.length > 0 ? "有阻塞" : "现在",
    },
    blockers: currentBlockers,
    pendingAcceptance,
    runtimeAlert,
    healthSummary: summarizeHealth(currentBlockers, pendingAcceptance, runtimeAlert),
  });
}

export async function getSemanticEntryGroups(): Promise<SemanticEntryGroup[]> {
  return [
    {
      title: "高频主干",
      description: "默认先读 AGENTS，再读战略、快照和唯一 plan 主源。",
      items: [
        entryDoc("AGENTS", "AGENTS.md", "高频执行入口"),
        entryDoc("路线图", "memory/project/roadmap.md", "目标、里程碑和成功标准"),
        entryDoc("当前状态", "memory/project/current-state.md", "当前焦点、阻塞和下一检查点"),
        entryDoc("运营蓝图", "memory/project/operating-blueprint.md", "唯一 plan 主源"),
      ],
    },
    {
      title: "按场景下钻",
      description: "需要判断场景、runbook 或结构边界时，再补这些主干文档。",
      items: [
        entryDoc("工作模式", "docs/WORK_MODES.md", "看场景语义、允许动作和退出条件"),
        entryDoc("开发工作流", "docs/DEV_WORKFLOW.md", "看门禁顺序、验证和发布 runbook"),
        entryDoc("架构", "docs/ARCHITECTURE.md", "看仓库拓扑、依赖方向和运行时边界"),
      ],
    },
    {
      title: "专项附录",
      description: "这些仍有效，但不再是默认第一跳。",
      items: [
        entryDoc("项目规则", "docs/PROJECT_RULES.md", "代码治理、兼容层和验证规则"),
        entryDoc("AI 工作模型", "docs/AI_OPERATING_MODEL.md", "AI 行为原则和最小脚本契约"),
        entryDoc("资产维护矩阵", "docs/ASSET_MAINTENANCE.md", "生成资产与维护方式"),
        entryDoc("模块索引", "code_index/module-index.md", "按需补代码导航"),
      ],
    },
    {
      title: "执行与发布",
      description: "进入 task 或验收后，再看这些执行页面。",
      items: [
        entryLink("执行面板", "/tasks", "查看真正可推进的事项"),
        entryLink("发布页", "/releases", "查看待验收版本、运行态和历史版本"),
        entryDoc("技术债", "memory/project/tech-debt.md", "看显性债务与删除计划"),
      ],
    },
  ];
}

function resolveHomeStage(
  thinkingBacklog: string[],
  planningBacklog: string[],
  stageBuckets: ReturnType<typeof groupTaskRowsByDemandStage>,
  pendingAcceptance: string | null,
): DemandStage {
  if (pendingAcceptance || stageBuckets.acceptance.length > 0) {
    return "acceptance";
  }
  if (stageBuckets.doing.length > 0) {
    return "doing";
  }
  if (stageBuckets.ready.length > 0) {
    return "ready";
  }
  if (planningBacklog.length > 0) {
    return "planning";
  }
  if (thinkingBacklog.length > 0) {
    return "thinking";
  }
  return "released";
}

function summarizeGoals(currentPriority: string, currentMilestone: string, successCriteria: string[]) {
  const lead = currentPriority || currentMilestone || "当前目标尚未写入。";
  const success = successCriteria[0];
  return success ? `${lead} 当前成功标准先看：${success}` : lead;
}

function summarizePlan(blueprintOverview: string, planningBacklog: string[], thinkingBacklog: string[]) {
  if (planningBacklog.length > 0 || thinkingBacklog.length > 0) {
    return `待规划 ${planningBacklog.length} 项，待思考 ${thinkingBacklog.length} 项。${planningBacklog[0] || thinkingBacklog[0] || blueprintOverview}`;
  }
  return blueprintOverview || "当前计划边界已收口，可继续看执行事项。";
}

function summarizeExecution(doingRows: Array<{ shortId: string; title: string }>, readyRows: Array<{ shortId: string; title: string }>) {
  if (doingRows.length > 0) {
    const lead = doingRows[0];
    return `进行中 ${doingRows.length} 项。当前主线：${lead.shortId} ${lead.title}`.trim();
  }
  if (readyRows.length > 0) {
    const lead = readyRows[0];
    return `待执行 ${readyRows.length} 项。下一项：${lead.shortId} ${lead.title}`.trim();
  }
  return "当前没有新的执行事项，先看计划边界或验收与运行。";
}

function summarizeAcceptance(pendingAcceptance: string | null, runtimeAlert: string | null, activeReleaseId: string | null) {
  if (pendingAcceptance) {
    return `${pendingAcceptance}，先做通过或驳回判断。`;
  }
  if (runtimeAlert) {
    return runtimeAlert;
  }
  if (activeReleaseId) {
    return `当前线上版本 ${activeReleaseId} 运行正常。`;
  }
  return "当前无待验收版本。";
}

function summarizeFocus(currentFocus: string[], nextCheckpoint: string[], currentPriority: string) {
  return currentFocus[0] || nextCheckpoint[0] || currentPriority || "当前焦点尚未写入。";
}

function summarizePendingAcceptance(pendingReleaseId: string | null, acceptanceVersionLabel: string | null) {
  if (pendingReleaseId) {
    return `待验收版本 ${pendingReleaseId}`;
  }
  if (acceptanceVersionLabel) {
    return `${acceptanceVersionLabel} 待验收`;
  }
  return null;
}

function summarizeRuntimeAlert(
  prodReason: string,
  prodStatus: string,
  devReason: string,
  devStatus: string,
  hasPendingAcceptance: boolean,
) {
  if (prodStatus !== "running") {
    return `production 异常：${prodReason}`;
  }
  if (hasPendingAcceptance && devStatus !== "running") {
    return `dev 预览异常：${devReason}`;
  }
  return null;
}

function summarizeHealth(blockers: string[], pendingAcceptance: string | null, runtimeAlert: string | null) {
  if (blockers.length > 0) {
    return "当前有阻塞，先处理当前焦点和提醒。";
  }
  if (pendingAcceptance) {
    return "当前有待验收版本，先做判断再继续推进。";
  }
  if (runtimeAlert) {
    return "当前运行存在异常，先恢复运行态。";
  }
  return "当前无待验收版本，运行正常，可继续按当前焦点推进。";
}

function buildFallbackCriteria(currentPriority: string, blueprintOverview: string) {
  return [currentPriority || blueprintOverview || "当前成功标准尚未写入。"];
}

function buildPlanBadge(planningCount: number, thinkingCount: number) {
  if (planningCount > 0) {
    return `待规划 ${planningCount}`;
  }
  if (thinkingCount > 0) {
    return `待思考 ${thinkingCount}`;
  }
  return "已收口";
}

function buildExecutionBadge(doingCount: number, readyCount: number) {
  if (doingCount > 0) {
    return `进行中 ${doingCount}`;
  }
  if (readyCount > 0) {
    return `待执行 ${readyCount}`;
  }
  return "空闲";
}

function entryDoc(label: string, path: string, description?: string): SemanticEntry {
  return { label, path, description };
}

function entryLink(label: string, href: string, description?: string): SemanticEntry {
  return { label, href, description };
}
