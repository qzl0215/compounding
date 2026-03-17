import { TASK_STATUS_LABELS } from "@/modules/tasks";
import type { BlueprintBoard, BlueprintGoal, CompanySnapshot, RoadmapSnapshot, SystemCard, TaskSummary } from "./types";
import { previewSection, splitChineseList } from "./parsing";

export function buildIdentitySnapshot(
  agentsState: Record<string, string>,
  missionAndVision: Record<string, string>,
  coreValues: string[],
): CompanySnapshot {
  return {
    oneLiner: agentsState["项目一句话"] ?? "项目一句话尚未写入主源。",
    mission: missionAndVision["使命"] || "使命尚未定义。",
    vision: missionAndVision["愿景"] || "愿景尚未定义。",
    values: coreValues.length ? coreValues : ["核心价值观尚未定义。"],
    successDefinition: agentsState["成功定义"] ?? "成功定义尚未写入主源。",
    mustProtect: splitChineseList(agentsState["必须保护"] ?? ""),
  };
}

export function buildRoadmapSnapshot(
  currentPhase: string,
  currentPriority: string,
  nextMilestone: string,
  successCriteria: string[],
): RoadmapSnapshot {
  return {
    currentPhase: currentPhase || "当前阶段尚未定义。",
    currentPriority: currentPriority || "当前优先级尚未定义。",
    nextMilestone: nextMilestone || "下个里程碑尚未定义。",
    successCriteria,
  };
}

export function buildBlueprintBoard(
  currentMilestone: string,
  currentPriority: string,
  goals: BlueprintGoal[],
  doingTasks: TaskSummary[],
  blockedItems: string[],
  nextCheckpoint: string[],
): BlueprintBoard {
  return {
    currentMilestone: currentMilestone || "当前里程碑尚未定义。",
    currentPriority: currentPriority || "当前优先级尚未定义。",
    currentMainline: currentMilestone || "当前主线尚未定义。",
    goals,
    doingTasks,
    blockedItems,
    nextCheckpoint,
  };
}

export function buildKnowledgeRiskCards(
  moduleIndexContent: string,
  dependencyMapContent: string,
  activeReleaseId: string | null,
  pendingDevReleaseId: string | null,
  techDebtContent: string,
  frozenItems: string[],
): SystemCard[] {
  return [
    {
      title: "执行入口",
      summary: "统一从 AGENTS 进入执行协议，再按路线图、运营蓝图、task、module.md 与 code index 逐层补足上下文。",
      href: "/knowledge-base?path=AGENTS.md",
    },
    {
      title: "记忆系统",
      summary: "memory/* 负责沉淀当前状态、经验、ADR 与技术债，只保留可复用结论与明确裁决。",
      href: "/knowledge-base?path=memory/project/current-state.md",
    },
    {
      title: "上下文索引",
      summary: `${previewSection(moduleIndexContent)} ${previewSection(dependencyMapContent)}`.trim(),
      href: "/knowledge-base?path=code_index/module-index.md",
    },
    {
      title: "关键冻结项",
      summary: frozenItems.length ? frozenItems.slice(0, 3).join("；") : "当前没有额外冻结项。",
      href: "/knowledge-base?path=memory/project/current-state.md",
    },
    {
      title: "发布与风险",
      summary: pendingDevReleaseId
        ? `当前存在待验收 dev：${pendingDevReleaseId}；请先完成 dev 验收，再决定是否晋升到 main。`
        : activeReleaseId
          ? `当前激活版本为 ${activeReleaseId}；${previewSection(techDebtContent, 1)}`
          : `当前尚未形成活跃 release；${previewSection(techDebtContent, 1)}`,
      href: "/releases",
    },
  ];
}

export function toTaskSummary(task: {
  title: string;
  goal: string;
  status: string;
  path: string;
  relatedModules: string[];
  updateTrace: { memory: string; index: string; roadmap: string; docs: string };
}): TaskSummary {
  return {
    title: task.title,
    goal: task.goal,
    status: TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS] ?? task.status,
    path: task.path,
    relatedModules: task.relatedModules,
    updateTrace: summarizeTaskTrace(task),
  };
}

function summarizeTaskTrace(task: { updateTrace: { memory: string; index: string; roadmap: string; docs: string } }) {
  return [task.updateTrace.memory, task.updateTrace.index, task.updateTrace.roadmap, task.updateTrace.docs]
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");
}
