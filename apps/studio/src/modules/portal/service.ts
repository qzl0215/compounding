import { extractSection, listDocsUnder, readDoc } from "@/modules/docs";
import { getReleaseDashboard } from "@/modules/releases/service";
import { listTaskCards } from "@/modules/tasks";
import {
  buildBattleBoard,
  buildCompanySnapshot,
  buildOnboardingSteps,
  buildRiskCards,
  buildSystemCards,
  toTaskSummary,
} from "./builders";
import { normalizeInline, parseBulletList, parseBulletMap, parseOrgModel } from "./parsing";
import type { HomeEntryLink, PortalOverview, SemanticEntry, SemanticEntryGroup } from "./types";

export const DEFAULT_DOC_PATH = "AGENTS.md";

export const HOME_ENTRY_LINKS: HomeEntryLink[] = [
  { href: "/knowledge-base?path=AGENTS.md", label: "打开 AGENTS", scope: "agents" },
  { href: "/tasks", label: "查看任务清单", scope: "tasks" },
  { href: "/knowledge-base?path=memory/project/roadmap.md", label: "查看路线图", scope: "roadmap" },
  { href: "/knowledge-base?path=memory/project/current-state.md", label: "查看当前状态", scope: "memory" },
];

export async function getPortalOverview(): Promise<PortalOverview> {
  const [agents, currentState, roadmap, techDebt, moduleIndex, dependencyMap, orgModel, taskCards] = await Promise.all([
    readDoc("AGENTS.md"),
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/roadmap.md"),
    readDoc("memory/project/tech-debt.md"),
    readDoc("code_index/module-index.md"),
    readDoc("code_index/dependency-map.md"),
    readDoc("docs/ORG_MODEL.md"),
    listTaskCards(),
  ]);

  const releaseDashboard = getReleaseDashboard();
  const agentsState = parseBulletMap(extractSection(agents.content, "current_state") ?? "");
  const projectSnapshot = parseBulletMap(extractSection(currentState.content, "project_snapshot") ?? "");
  const currentFocus = parseBulletList(extractSection(currentState.content, "current_focus") ?? "");
  const nextCheckpoint = parseBulletList(extractSection(currentState.content, "next_checkpoint") ?? "");
  const roadmapPhase = normalizeInline(extractSection(roadmap.content, "current_phase") ?? projectSnapshot["当前阶段"] ?? "");
  const currentPriority = normalizeInline(extractSection(roadmap.content, "current_priority") ?? agentsState["当前优先级"] ?? "");
  const taskSummaries = taskCards.map(toTaskSummary);
  const doingTasks = taskSummaries.filter((task) => task.status === "进行中");
  const blockedTasks = taskSummaries.filter((task) => task.status === "阻塞中");

  return {
    homeLinks: HOME_ENTRY_LINKS,
    company: buildCompanySnapshot(agentsState, projectSnapshot, roadmapPhase),
    battle: buildBattleBoard(currentPriority, roadmapPhase, currentFocus, doingTasks, blockedTasks, nextCheckpoint),
    org: parseOrgModel(orgModel.content),
    systems: buildSystemCards(taskSummaries, moduleIndex.content, dependencyMap.content, releaseDashboard.active_release_id),
    onboarding: buildOnboardingSteps(),
    risks: buildRiskCards(blockedTasks, extractSection(techDebt.content, "active_debt") ?? techDebt.content, releaseDashboard.active_release_id),
  };
}

export async function getSemanticEntryGroups(): Promise<SemanticEntryGroup[]> {
  const taskPaths = await listDocsUnder("tasks/queue");
  return [
    {
      title: "公司介绍",
      items: [entry("AGENTS 入口", "AGENTS.md"), entry("项目规则", "docs/PROJECT_RULES.md"), entry("AI 工作模型", "docs/AI_OPERATING_MODEL.md")],
    },
    {
      title: "今日作战",
      items: [entry("当前状态", "memory/project/current-state.md"), entry("路线图", "memory/project/roadmap.md"), ...taskPaths.map(toTaskEntry)],
    },
    {
      title: "组织架构",
      items: [
        entry("组织模型", "docs/ORG_MODEL.md"),
        entry("架构说明", "docs/ARCHITECTURE.md"),
        entry("系统总览", "memory/architecture/system-overview.md"),
      ],
    },
    {
      title: "核心系统",
      items: [
        entry("模块索引", "code_index/module-index.md"),
        entry("依赖图", "code_index/dependency-map.md"),
        entry("函数索引", "code_index/function-index.json"),
      ],
    },
    {
      title: "新人入职",
      items: [
        entry("AGENTS 入口", "AGENTS.md"),
        entry("任务模板", "tasks/templates/task-template.md"),
        entry("模块索引", "code_index/module-index.md"),
      ],
    },
    {
      title: "风险与发布",
      items: [
        entry("技术债", "memory/project/tech-debt.md"),
        entry("开发工作流", "docs/DEV_WORKFLOW.md"),
        entry("重构计划", "docs/REFACTOR_PLAN.md"),
      ],
    },
  ];
}

export function formatWorktreeStatus(value: string) {
  return value.trim() ? value : "干净";
}

export function formatSyncStatus(value: string) {
  const labels: Record<string, string> = {
    no_remote: "无远端",
    no_upstream: "无上游分支",
    fetch_failed: "拉取远端失败",
    sync_unknown: "同步状态未知",
    diverged: "已分叉",
    behind: "落后于上游",
    ahead: "领先于上游",
    up_to_date: "已同步",
  };
  return labels[value] ?? value;
}

function entry(label: string, path: string): SemanticEntry {
  return { label, path };
}

function toTaskEntry(path: string) {
  const fileName = path.split("/").pop() ?? path;
  return entry(fileName, path);
}
