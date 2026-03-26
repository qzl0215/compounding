import { getProjectStateSnapshot } from "@/modules/project-state";
import { formatEstimatedTokens } from "../../../../../shared/ai-efficiency";
import { buildHomeLogicMapSnapshot } from "./builders";
import { HOME_ENTRY_LINKS } from "./constants";
import type { HomeLogicMapSnapshot, SemanticEntry, SemanticEntryGroup } from "./types";

export { DEFAULT_DOC_PATH, HOME_ENTRY_LINKS } from "./constants";

export async function getHomeStatusBoard(): Promise<HomeLogicMapSnapshot> {
  const projectState = await getProjectStateSnapshot();

  return buildHomeLogicMapSnapshot({
    name: projectState.identity.name,
    oneLiner: projectState.identity.oneLiner,
    overallSummary: projectState.headline.overallSummary,
    currentPhase: projectState.headline.currentPhase,
    currentMilestone: projectState.headline.currentMilestone,
    successCriteria: projectState.success.criteria,
    activeStage: projectState.activeStage,
    goals: {
      summary: summarizeGoals(projectState.headline.currentPriority, projectState.headline.currentMilestone, projectState.success.criteria),
      badge: projectState.headline.currentPhase || "当前阶段",
    },
    plan: {
      summary: projectState.plan.summary,
      badge: buildPlanBadge(projectState.plan.planningBacklog.length, projectState.plan.thinkingBacklog.length),
    },
    execution: {
      summary: projectState.execution.summary,
      badge: buildExecutionBadge(projectState.execution.counts.doing + projectState.execution.counts.blocked, projectState.execution.counts.ready),
    },
    acceptance: {
      summary: summarizeAcceptance(
        projectState.release.pendingAcceptance,
        projectState.release.runtimeAlert,
        projectState.release.activeReleaseId,
      ),
      badge: projectState.release.pendingAcceptance ? "待验收" : projectState.release.runtimeAlert ? "异常" : "稳定",
    },
    focus: {
      summary: projectState.focus.summary,
      badge: projectState.focus.blockers.length > 0 ? "有阻塞" : "现在",
    },
    blockers: projectState.focus.blockers,
    pendingAcceptance: projectState.release.pendingAcceptance,
    runtimeAlert: projectState.release.runtimeAlert,
    healthSummary: projectState.release.healthSummary,
    aiEfficiency: {
      totalSavedLabel: `~${formatEstimatedTokens(projectState.aiEfficiency.dashboard.overview.total_saved_tokens_est)}`,
      avgSavingsLabel: `${projectState.aiEfficiency.dashboard.overview.avg_savings_pct_est}%`,
      alert: projectState.aiEfficiency.dashboard.adoption.alerts[0]
        ? `${projectState.aiEfficiency.dashboard.adoption.alerts[0].shortcut_id} adoption ${projectState.aiEfficiency.dashboard.adoption.alerts[0].adoption_pct}%`
        : null,
      contextPattern: projectState.aiEfficiency.dashboard.context_waste.top_time_loss_patterns[0]
        ? projectState.aiEfficiency.dashboard.context_waste.top_time_loss_patterns[0].signature
        : null,
      contextMode: "balanced",
    },
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

function summarizeGoals(currentPriority: string, currentMilestone: string, successCriteria: string[]) {
  const lead = currentPriority || currentMilestone || "当前目标尚未写入。";
  const success = successCriteria[0];
  return success ? `${lead} 当前先看：${success}` : lead;
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

function buildPlanBadge(planningCount: number, thinkingCount: number) {
  if (planningCount > 0) return `待规划 ${planningCount}`;
  if (thinkingCount > 0) return `待思考 ${thinkingCount}`;
  return "已收口";
}

function buildExecutionBadge(doingCount: number, readyCount: number) {
  if (doingCount > 0) return `进行中 ${doingCount}`;
  if (readyCount > 0) return `待执行 ${readyCount}`;
  return "空闲";
}

function entryDoc(label: string, path: string, description?: string): SemanticEntry {
  return { label, path, description };
}

function entryLink(label: string, href: string, description?: string): SemanticEntry {
  return { label, href, description };
}
