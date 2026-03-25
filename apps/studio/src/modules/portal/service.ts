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
  const blockers = summarizeBlockers(currentBlockers);
  const activeStage = resolveHomeStage(thinkingBacklog, planningBacklog, stageBuckets, pendingAcceptance);
  const overallSummary = summarizeHeadline(currentFocus, currentPriority, blueprintOverview, pendingAcceptance, runtimeAlert);

  return buildHomeLogicMapSnapshot({
    name: workspaceLabel,
    oneLiner: summarizeOneLiner(blueprintOverview, currentPriority, currentMilestone),
    overallSummary,
    currentPhase: roadmapPhase || "当前阶段尚未定义。",
    currentMilestone: currentMilestone || "当前里程碑尚未定义。",
    successCriteria: summarizeSuccessCriteria(successCriteria, currentPriority, currentMilestone, blueprintOverview),
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
      badge: blockers.length > 0 ? "有阻塞" : "现在",
    },
    blockers,
    pendingAcceptance,
    runtimeAlert,
    healthSummary: summarizeHealth(blockers, pendingAcceptance, runtimeAlert),
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
  const lead = simplifyHumanSentence(currentPriority) || simplifyHumanSentence(currentMilestone) || "当前目标尚未写入。";
  const success = summarizeSuccessCriteria(successCriteria, currentPriority, currentMilestone, "")[0];
  return success ? `${lead} 当前先看：${success}` : lead;
}

function summarizePlan(blueprintOverview: string, planningBacklog: string[], thinkingBacklog: string[]) {
  if (planningBacklog.length > 0 || thinkingBacklog.length > 0) {
    return `待规划 ${planningBacklog.length} 项，待思考 ${thinkingBacklog.length} 项。先收口边界，再进入执行。`;
  }
  return simplifyHumanSentence(blueprintOverview) || "当前计划边界已收口，可继续看执行事项。";
}

function summarizeExecution(doingRows: Array<{ shortId: string; title: string }>, readyRows: Array<{ shortId: string; title: string }>) {
  if (doingRows.length > 0) {
    return `当前有 ${doingRows.length} 项在推进，细节看执行面板。`;
  }
  if (readyRows.length > 0) {
    return `当前有 ${readyRows.length} 项可开工，先看执行面板。`;
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
  return (
    simplifyHumanSentence(currentFocus[0]) ||
    simplifyHumanSentence(nextCheckpoint[0]) ||
    simplifyHumanSentence(currentPriority) ||
    "当前焦点尚未写入。"
  );
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

function summarizeOneLiner(blueprintOverview: string, currentPriority: string, currentMilestone: string) {
  return (
    simplifyHumanSentence(currentPriority) ||
    simplifyHumanSentence(blueprintOverview) ||
    simplifyHumanSentence(currentMilestone) ||
    "项目一句话目标尚未写入。"
  );
}

function summarizeHeadline(
  currentFocus: string[],
  currentPriority: string,
  blueprintOverview: string,
  pendingAcceptance: string | null,
  runtimeAlert: string | null,
) {
  if (pendingAcceptance) {
    return `${pendingAcceptance}，先完成验收判断。`;
  }
  if (runtimeAlert) {
    return runtimeAlert;
  }
  return (
    simplifyHumanSentence(currentFocus[0]) ||
    simplifyHumanSentence(currentPriority) ||
    simplifyHumanSentence(blueprintOverview) ||
    "当前焦点尚未写入。"
  );
}

function summarizeSuccessCriteria(successCriteria: string[], currentPriority: string, currentMilestone: string, blueprintOverview: string) {
  const normalized = successCriteria
    .map((item) => normalizeSuccessCriterion(item))
    .filter((item): item is string => Boolean(item));

  if (normalized.length > 0) {
    return normalized.slice(0, 3);
  }

  const fallback = simplifyHumanSentence(currentPriority) || simplifyHumanSentence(currentMilestone) || simplifyHumanSentence(blueprintOverview);
  return [fallback || "当前成功标准尚未写入。"];
}

function normalizeSuccessCriterion(value: string) {
  const text = simplifyHumanSentence(value);
  if (!text) {
    return null;
  }
  if (text.includes("首屏不滚动即可回答")) {
    return "首屏能回答目标、阶段、风险和下一步";
  }
  if (text.includes("逻辑结构图")) {
    return "首页主视觉是可点击的逻辑结构图";
  }
  if (text.includes("退出首页") || text.includes("不再")) {
    return "首页不再平铺工程内部对象";
  }
  if (text.includes("不新增新状态源") || text.includes("重型框架") || text.includes("图形库")) {
    return null;
  }
  return text;
}

function summarizeBlockers(blockers: string[]) {
  const normalized = blockers
    .map((item) => normalizeBlocker(item))
    .filter((item): item is string => Boolean(item));
  return Array.from(new Set(normalized));
}

function normalizeBlocker(value: string) {
  const text = normalizeInline(value).replace(/`/g, "");
  if (!text) {
    return null;
  }
  if (text.includes("没有发布阻塞")) {
    return "新首页必须彻底脱离旧工程壳，不能只换一层文案。";
  }
  if (text.includes("只换视觉") || text.includes("回流")) {
    return "首页必须连同读模型一起收口，避免旧结构回流。";
  }
  return simplifyHumanSentence(text);
}

function simplifyHumanSentence(value: string | null | undefined) {
  if (!value) {
    return "";
  }

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

  const firstClause = text.split(/[；。]/u).map((part) => part.trim()).find(Boolean) || text;
  return firstClause;
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
