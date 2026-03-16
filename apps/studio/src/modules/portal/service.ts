import { extractSection, listDocsUnder, readDoc } from "@/modules/docs";
import { getReleaseDashboard } from "@/modules/releases/service";
import { listTaskCards } from "@/modules/tasks";
import {
  buildBlueprintBoard,
  buildIdentitySnapshot,
  buildKnowledgeRiskCards,
  buildRoadmapSnapshot,
  toTaskSummary,
} from "./builders";
import { normalizeInline, parseBlueprintGoals, parseBulletList, parseBulletMap, parseOrgModel, parseWorkModeFlow } from "./parsing";
import type { HomeEntryLink, PortalOverview, SemanticEntry, SemanticEntryGroup } from "./types";

export const DEFAULT_DOC_PATH = "AGENTS.md";

export const HOME_ENTRY_LINKS: HomeEntryLink[] = [
  { href: "/knowledge-base?path=AGENTS.md", label: "执行入口", scope: "agents" },
  { href: "/knowledge-base?path=memory/project/roadmap.md", label: "战略路线", scope: "roadmap" },
  { href: "/tasks", label: "任务清单", scope: "tasks" },
  { href: "/releases", label: "发布记录", scope: "release" },
];

export async function getPortalOverview(): Promise<PortalOverview> {
  const [agents, currentState, roadmap, blueprint, techDebt, moduleIndex, dependencyMap, orgModel, workModes, taskCards] = await Promise.all([
    readDoc("AGENTS.md"),
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/roadmap.md"),
    readDoc("memory/project/operating-blueprint.md"),
    readDoc("memory/project/tech-debt.md"),
    readDoc("code_index/module-index.md"),
    readDoc("code_index/dependency-map.md"),
    readDoc("docs/ORG_MODEL.md"),
    readDoc("docs/WORK_MODES.md"),
    listTaskCards(),
  ]);

  const releaseDashboard = getReleaseDashboard();
  const agentsState = parseBulletMap(extractSection(agents.content, "current_state") ?? "");
  const projectSnapshot = parseBulletMap(extractSection(currentState.content, "project_snapshot") ?? "");
  const missionAndVision = parseBulletMap(extractSection(currentState.content, "mission_and_vision") ?? "");
  const coreValues = parseBulletList(extractSection(currentState.content, "core_values") ?? "");
  const frozenItems = parseBulletList(extractSection(currentState.content, "frozen_items") ?? "");
  const roadmapPhase = normalizeInline(extractSection(roadmap.content, "current_phase") ?? projectSnapshot["当前阶段"] ?? "");
  const currentPriority = normalizeInline(extractSection(roadmap.content, "current_priority") ?? agentsState["当前优先级"] ?? "");
  const nextMilestone = normalizeInline(extractSection(roadmap.content, "next_milestone") ?? "");
  const milestoneSuccessCriteria = parseBulletList(extractSection(roadmap.content, "milestone_success_criteria") ?? "");
  const currentMilestone = normalizeInline(extractSection(blueprint.content, "current_milestone") ?? nextMilestone);
  const blueprintGoals = parseBlueprintGoals(blueprint.content);
  const nextCheckpoint = parseBulletList(extractSection(blueprint.content, "next_checkpoint") ?? "");
  const taskSummaries = taskCards.map(toTaskSummary);
  const doingTasks = taskSummaries.filter((task) => task.status === "进行中");
  const blockedItems = [
    ...parseBulletList(extractSection(blueprint.content, "current_blockers") ?? ""),
    ...taskSummaries.filter((task) => task.status === "阻塞中").map((task) => `${task.title}（${task.status}）`),
  ];

  return {
    homeLinks: HOME_ENTRY_LINKS,
    identity: buildIdentitySnapshot(agentsState, missionAndVision, coreValues),
    roadmap: buildRoadmapSnapshot(roadmapPhase, currentPriority, nextMilestone, milestoneSuccessCriteria),
    blueprint: buildBlueprintBoard(currentMilestone, currentPriority, blueprintGoals, doingTasks, blockedItems, nextCheckpoint),
    workModeFlow: [
      {
        kind: "trigger",
        name: "需求提出",
        summary: "用户需求、问题或机会进入系统，触发后续工作模式链路。",
        href: "/knowledge-base?path=AGENTS.md",
      },
      ...parseWorkModeFlow(workModes.content),
    ],
    org: parseOrgModel(orgModel.content),
    knowledgeRisk: buildKnowledgeRiskCards(
      moduleIndex.content,
      dependencyMap.content,
      releaseDashboard.active_release_id,
      extractSection(techDebt.content, "active_debt") ?? techDebt.content,
      frozenItems,
    ),
  };
}

export async function getSemanticEntryGroups(): Promise<SemanticEntryGroup[]> {
  const taskPaths = await listDocsUnder("tasks/queue");
  return [
    {
      title: "使命与方向",
      items: [entry("AGENTS 入口", "AGENTS.md"), entry("当前状态", "memory/project/current-state.md"), entry("项目规则", "docs/PROJECT_RULES.md")],
    },
    {
      title: "路线图与蓝图",
      items: [entry("路线图", "memory/project/roadmap.md"), entry("运营蓝图", "memory/project/operating-blueprint.md")],
    },
    {
      title: "任务与交付",
      items: [entry("任务模板", "tasks/templates/task-template.md"), entry("开发工作流", "docs/DEV_WORKFLOW.md"), ...taskPaths.map(toTaskEntry)],
    },
    {
      title: "工作模式与职责",
      items: [
        entry("工作模式", "docs/WORK_MODES.md"),
        entry("组织模型", "docs/ORG_MODEL.md"),
        entry("架构说明", "docs/ARCHITECTURE.md"),
        entry("系统总览", "memory/architecture/system-overview.md"),
      ],
    },
    {
      title: "认知资产",
      items: [
        entry("AI 工作模型", "docs/AI_OPERATING_MODEL.md"),
        entry("模块索引", "code_index/module-index.md"),
        entry("依赖图", "code_index/dependency-map.md"),
        entry("函数索引", "code_index/function-index.json"),
        entry("经验记录说明", "memory/experience/README.md"),
      ],
    },
    {
      title: "风险与发布",
      items: [
        entry("技术债", "memory/project/tech-debt.md"),
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
