import { extractSection, readDoc } from "@/modules/docs";
import { getDeliverySnapshot } from "@/modules/delivery";
import {
  buildDirectionSummary,
  buildOverviewSummary,
  buildRuntimeFacts,
  toRuntimeSignal,
} from "./builders";
import { buildAcceptanceReleaseItems, buildDocItems, buildReleasedItems, buildTaskItem, dedupeItems } from "./overview-items";
import { normalizeInline, parseBulletList, parseBulletMap } from "./parsing";
import { groupTaskRowsByDemandStage } from "./stage-model";
import type { HomeEntryLink, ProjectOverviewSnapshot, SemanticEntry, SemanticEntryGroup } from "./types";

export const DEFAULT_DOC_PATH = "AGENTS.md";

export const HOME_ENTRY_LINKS: HomeEntryLink[] = [
  { href: "/knowledge-base?path=AGENTS.md", label: "执行入口", scope: "agents" },
  { href: "/knowledge-base?path=memory/project/roadmap.md", label: "战略路线", scope: "roadmap" },
  { href: "/tasks", label: "执行面板", scope: "tasks" },
  { href: "/releases", label: "发布事实", scope: "release" },
];

export async function getProjectOverview(): Promise<ProjectOverviewSnapshot> {
  const [currentState, roadmap, blueprint, deliverySnapshot] = await Promise.all([
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/roadmap.md"),
    readDoc("memory/project/operating-blueprint.md"),
    getDeliverySnapshot(),
  ]);

  const missionAndVision = parseBulletMap(extractSection(currentState.content, "mission_and_vision") ?? "");
  const frozenItems = parseBulletList(extractSection(currentState.content, "frozen_items") ?? "");
  const roadmapPhase = normalizeInline(extractSection(roadmap.content, "current_phase") ?? "");
  const currentPriority = normalizeInline(extractSection(roadmap.content, "current_priority") ?? "");
  const currentMilestone = normalizeInline(extractSection(blueprint.content, "current_milestone") ?? roadmapPhase);
  const nextDirection = normalizeInline(
    extractSection(roadmap.content, "next_direction") ?? extractSection(roadmap.content, "next_milestone") ?? ""
  );
  const thinkingBacklog = parseBulletList(extractSection(blueprint.content, "thinking_backlog") ?? "");
  const nextConversation = parseBulletList(extractSection(blueprint.content, "next_conversation") ?? "");
  const planningBacklog = dedupeItems([
    ...parseBulletList(extractSection(roadmap.content, "planning_backlog") ?? ""),
    ...parseBulletList(extractSection(blueprint.content, "planning_backlog") ?? ""),
  ]);
  const taskRows = deliverySnapshot.projections.taskRows;
  const releaseDashboard = deliverySnapshot.facts.releaseDashboard;
  const stageBuckets = groupTaskRowsByDemandStage(taskRows);
  const blockedItems = [
    ...parseBulletList(extractSection(blueprint.content, "current_blockers") ?? ""),
    ...taskRows.filter((task) => task.status === "blocked").map((task) => `${task.shortId} ${task.title}（已阻塞）`),
  ];
  const nextCheckpoint = parseBulletList(extractSection(currentState.content, "next_checkpoint") ?? "");
  const pendingDevSummary = releaseDashboard.pending_dev_release
    ? `当前存在待验收 dev：${releaseDashboard.pending_dev_release.release_id}。先完成验收判断，再决定是否继续推进。`
    : releaseDashboard.active_release_id
      ? `当前没有待验收 dev。已激活的 production 版本是 ${releaseDashboard.active_release_id}。`
      : "当前没有待验收 dev，也还没有激活的 production 版本。";

  return {
    overview: buildOverviewSummary(missionAndVision, roadmapPhase, currentMilestone, currentPriority),
    direction: buildDirectionSummary(nextDirection || currentPriority),
    thinkingItems: buildDocItems({
      values: thinkingBacklog,
      stage: "thinking",
      source: "运营蓝图",
      evidenceHref: "/knowledge-base?path=memory/project/operating-blueprint.md",
      actions: nextConversation,
    }),
    planningItems: [
      ...buildDocItems({
        values: planningBacklog,
        stage: "planning",
        source: "路线图 / 蓝图",
        evidenceHref: "/knowledge-base?path=memory/project/roadmap.md",
      }),
      ...stageBuckets.planning.map((row) => buildTaskItem(row)),
    ],
    readyItems: stageBuckets.ready.map((row) => buildTaskItem(row)),
    doingItems: stageBuckets.doing.map((row) => buildTaskItem(row)),
    acceptanceItems: [
      ...buildAcceptanceReleaseItems(releaseDashboard.pending_dev_release?.release_id || null),
      ...stageBuckets.acceptance.map((row) => buildTaskItem(row)),
    ],
    releasedItems: buildReleasedItems(stageBuckets.released, releaseDashboard.active_release_id),
    runtimeFacts: buildRuntimeFacts(
      pendingDevSummary,
      releaseDashboard.active_release_id,
      blockedItems,
      nextCheckpoint,
      frozenItems,
      [toRuntimeSignal("dev 预览", releaseDashboard.local_preview), toRuntimeSignal("production", releaseDashboard.local_runtime)],
    ),
  };
}

export const getProjectCockpit = getProjectOverview;
export const getPortalOverview = getProjectOverview;

export async function getSemanticEntryGroups(): Promise<SemanticEntryGroup[]> {
  return [
    {
      title: "项目全貌",
      description: "先看当前状态、路线图和运营蓝图。",
      items: [
        entryDoc("当前状态", "memory/project/current-state.md", "当前运营快照"),
        entryDoc("路线图", "memory/project/roadmap.md", "当前阶段、方向与待规划"),
        entryDoc("运营蓝图", "memory/project/operating-blueprint.md", "待思考、待规划与下一步对话"),
        entryDoc("AGENTS 入口", "AGENTS.md", "高频执行入口"),
      ],
    },
    {
      title: "待思考证据",
      description: "还不能直接开工的问题、机会点和启发式追问。",
      items: [
        entryDoc("运营蓝图 · 待思考", "memory/project/operating-blueprint.md", "未成熟事项与下一步对话"),
        entryDoc("当前状态", "memory/project/current-state.md", "当前焦点与冻结项"),
      ],
    },
    {
      title: "待规划证据",
      description: "已经成立但还没收口的方向与规划边界。",
      items: [
        entryDoc("路线图 · 待规划", "memory/project/roadmap.md", "下一阶段方向与待规划"),
        entryDoc("运营蓝图 · 待规划", "memory/project/operating-blueprint.md", "待验证的规划边界"),
        entryLink("执行面板", "/tasks", "查看规划类 task 与可执行事项的分界"),
      ],
    },
    {
      title: "执行规则",
      description: "当事情进入可执行边界后，再看这些规则和入口。",
      items: [
        entryDoc("项目规则", "docs/PROJECT_RULES.md", "代码与结构边界"),
        entryDoc("开发工作流", "docs/DEV_WORKFLOW.md", "规划、执行、交付 runbook"),
        entryDoc("AI 工作模型", "docs/AI_OPERATING_MODEL.md", "AI 如何判断需求环节"),
        entryLink("执行面板", "/tasks", "查看可执行事项和执行事实"),
      ],
    },
    {
      title: "发布事实",
      description: "运行态、版本和验收事实只在这些入口看。",
      items: [
        entryLink("发布页", "/releases", "查看待验收版本、运行态和历史版本"),
        entryDoc("当前状态", "memory/project/current-state.md", "当前运行边界与检查点"),
        entryDoc("技术债", "memory/project/tech-debt.md", "发布前后的显性债务"),
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

function entryDoc(label: string, path: string, description?: string): SemanticEntry {
  return { label, path, description };
}

function entryLink(label: string, href: string, description?: string): SemanticEntry {
  return { label, href, description };
}
