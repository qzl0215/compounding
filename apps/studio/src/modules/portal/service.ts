import { extractSection, readDoc } from "@/modules/docs";
import { getDeliverySnapshot } from "@/modules/delivery";
import {
  buildHomepageProjection,
  buildDirectionSummary,
  buildOverviewSummary,
  buildRuntimeFacts,
  toRuntimeSignal,
} from "./builders";
import { buildAcceptanceReleaseItems, buildDocItems, buildReleasedItems, buildTaskItem } from "./overview-items";
import { normalizeInline, parseBulletList } from "./parsing";
import { groupTaskRowsByDemandStage } from "./stage-model";
import type { HomeEntryLink, ProjectOverviewSnapshot, SemanticEntry, SemanticEntryGroup } from "./types";

export const DEFAULT_DOC_PATH = "AGENTS.md";

export const HOME_ENTRY_LINKS: HomeEntryLink[] = [
  { href: "/knowledge-base", label: "证据库", description: "看主源、规则和背景。", scope: "memory" },
  { href: "/tasks", label: "执行面板", description: "看真正可推进的事项。", scope: "tasks" },
  { href: "/releases", label: "发布事实", description: "看验收、版本和运行态。", scope: "release" },
];

export async function getProjectOverview(): Promise<ProjectOverviewSnapshot> {
  const [currentState, roadmap, blueprint, deliverySnapshot] = await Promise.all([
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/roadmap.md"),
    readDoc("memory/project/operating-blueprint.md"),
    getDeliverySnapshot(),
  ]);

  const currentFocus = parseBulletList(extractSection(currentState.content, "current_focus") ?? "");
  const frozenItems = parseBulletList(extractSection(currentState.content, "frozen_items") ?? "");
  const blueprintOverview = normalizeInline(extractSection(blueprint.content, "plan_overview") ?? "");
  const roadmapPhase = normalizeInline(extractSection(roadmap.content, "current_phase") ?? "");
  const currentPriority = normalizeInline(extractSection(roadmap.content, "current_priority") ?? "");
  const currentMilestone = normalizeInline(extractSection(roadmap.content, "current_milestone") ?? roadmapPhase);
  const nextDirection = normalizeInline(extractSection(roadmap.content, "next_direction") ?? "");
  const thinkingBacklog = parseBulletList(extractSection(blueprint.content, "thinking_backlog") ?? "");
  const nextConversation = parseBulletList(extractSection(blueprint.content, "next_conversation") ?? "");
  const planningBacklog = parseBulletList(extractSection(blueprint.content, "planning_backlog") ?? "");
  const currentBlockers = parseBulletList(extractSection(currentState.content, "current_blockers") ?? "");
  const taskRows = deliverySnapshot.projections.taskRows;
  const releaseDashboard = deliverySnapshot.facts.releaseDashboard;
  const stageBuckets = groupTaskRowsByDemandStage(taskRows);
  const blockedItems = [
    ...currentBlockers,
    ...taskRows.filter((task) => task.status === "blocked").map((task) => `${task.shortId} ${task.title}（已阻塞）`),
  ];
  const nextCheckpoint = parseBulletList(extractSection(currentState.content, "next_checkpoint") ?? "");
  const pendingDevSummary = releaseDashboard.pending_dev_release
    ? `待验收版本：${releaseDashboard.pending_dev_release.release_id}`
    : "当前无待验收版本";

  const snapshot = {
    overview: buildOverviewSummary(blueprintOverview || currentFocus[0] || currentPriority, roadmapPhase, currentMilestone, currentPriority),
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
        source: "运营蓝图",
        evidenceHref: "/knowledge-base?path=memory/project/operating-blueprint.md",
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

  return {
    ...snapshot,
    homepage: buildHomepageProjection(snapshot),
  };
}

export async function getSemanticEntryGroups(): Promise<SemanticEntryGroup[]> {
  return [
    {
      title: "高频主干",
      description: "默认先读 AGENTS，再读战略、快照和当前计划。",
      items: [
        entryDoc("AGENTS", "AGENTS.md", "高频执行入口"),
        entryDoc("路线图", "memory/project/roadmap.md", "阶段、里程碑和方向"),
        entryDoc("当前状态", "memory/project/current-state.md", "当前运营快照"),
        entryDoc("运营蓝图", "memory/project/operating-blueprint.md", "唯一 plan 主源"),
      ],
    },
    {
      title: "按场景下钻",
      description: "进入对应场景后，再补工作模式、runbook 和架构边界。",
      items: [
        entryDoc("工作模式", "docs/WORK_MODES.md", "看场景语义、输入和退出条件"),
        entryDoc("开发工作流", "docs/DEV_WORKFLOW.md", "看执行顺序、门禁和发布 runbook"),
        entryDoc("架构", "docs/ARCHITECTURE.md", "看仓库拓扑、依赖方向和运行时边界"),
      ],
    },
    {
      title: "专项附录",
      description: "这些文档仍有效，但不再是默认第一跳。",
      items: [
        entryDoc("项目规则", "docs/PROJECT_RULES.md", "代码治理、兼容层和验证规则"),
        entryDoc("AI 工作模型", "docs/AI_OPERATING_MODEL.md", "AI 行为原则和最小脚本契约"),
        entryDoc("资产维护矩阵", "docs/ASSET_MAINTENANCE.md", "生成资产与维护方式"),
        entryDoc("模块索引", "code_index/module-index.md", "按需补代码导航"),
      ],
    },
    {
      title: "执行与发布",
      description: "进入 task 或 release 后，再补这些事实入口。",
      items: [
        entryLink("执行面板", "/tasks", "查看真正可推进的事项"),
        entryLink("发布页", "/releases", "查看待验收版本、运行态和历史版本"),
        entryDoc("技术债", "memory/project/tech-debt.md", "看显性债务与删除计划"),
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
