import { extractSection, listDocsUnder, readDoc } from "@/modules/docs";
import { listTaskCards, TASK_STATUS_LABELS } from "@/modules/tasks";
import type { HomeEntryLink, OverviewSnippet, PortalOverview, SemanticEntry, SemanticEntryGroup } from "./types";

export const DEFAULT_DOC_PATH = "AGENTS.md";

export const HOME_ENTRY_LINKS: HomeEntryLink[] = [
  { href: "/knowledge-base?path=AGENTS.md", label: "打开 AGENTS", scope: "agents" },
  { href: "/tasks", label: "查看任务清单", scope: "tasks" },
  { href: "/knowledge-base?path=memory/project/roadmap.md", label: "查看路线图", scope: "roadmap" },
  { href: "/knowledge-base?path=memory/project/current-state.md", label: "查看当前状态", scope: "memory" }
];

export async function getPortalOverview(): Promise<PortalOverview> {
  const [agents, architecture, currentState, roadmap, techDebt, moduleIndex, dependencyMap, taskCards, experiencePaths, decisionPaths] =
    await Promise.all([
      readDoc("AGENTS.md"),
      readDoc("docs/ARCHITECTURE.md"),
      readDoc("memory/project/current-state.md"),
      readDoc("memory/project/roadmap.md"),
      readDoc("memory/project/tech-debt.md"),
      readDoc("code_index/module-index.md"),
      readDoc("code_index/dependency-map.md"),
      listTaskCards(),
      listDocsUnder("memory/experience"),
      listDocsUnder("memory/decisions")
    ]);

  const recentExperiencePath = experiencePaths.filter((path) => path !== "memory/experience/README.md").slice(-1)[0];
  const recentDecisionPath = decisionPaths.slice(-1)[0];
  const memorySnippets: OverviewSnippet[] = [
    toOverviewSnippet("项目状态", "memory/project/current-state.md", extractSection(currentState.content, "project_snapshot") ?? currentState.content),
    toOverviewSnippet("技术债", "memory/project/tech-debt.md", extractSection(techDebt.content, "active_debt") ?? techDebt.content)
  ];

  if (recentExperiencePath) {
    const experienceDoc = await readDoc(recentExperiencePath);
    memorySnippets.push(toOverviewSnippet("最近经验", recentExperiencePath, extractSection(experienceDoc.content, "decision") ?? experienceDoc.content));
  }
  if (recentDecisionPath) {
    const decisionDoc = await readDoc(recentDecisionPath);
    memorySnippets.push(toOverviewSnippet("最近 ADR", recentDecisionPath, extractSection(decisionDoc.content, "decision") ?? decisionDoc.content));
  }

  return {
    projectIntro: extractSection(agents.content, "current_state"),
    currentFocus: extractSection(currentState.content, "current_focus"),
    roadmap: roadmap.content,
    tasks: taskCards.map((task) => ({
      title: task.title,
      goal: task.goal,
      status: TASK_STATUS_LABELS[task.status],
      path: task.path,
      updateTrace: summarizeTaskTrace(task),
    })),
    memory: memorySnippets,
    index: [
      toOverviewSnippet("模块索引", "code_index/module-index.md", extractSection(moduleIndex.content, "studio_modules_index") ?? moduleIndex.content),
      toOverviewSnippet("依赖方向", "code_index/dependency-map.md", extractSection(dependencyMap.content, "dependency_direction") ?? dependencyMap.content)
    ],
    roleOverview: extractSection(architecture.content, "operating_roles")
  };
}

export async function getSemanticEntryGroups(): Promise<SemanticEntryGroup[]> {
  const [taskPaths, experiencePaths, decisionPaths] = await Promise.all([
    listDocsUnder("tasks/queue"),
    listDocsUnder("memory/experience"),
    listDocsUnder("memory/decisions")
  ]);

  return [
    {
      title: "项目介绍与规则",
      items: [
        entry("AGENTS 入口", "AGENTS.md"),
        entry("项目规则", "docs/PROJECT_RULES.md"),
        entry("AI 工作模型", "docs/AI_OPERATING_MODEL.md")
      ]
    },
    {
      title: "当前主线与状态",
      items: [
        entry("当前状态", "memory/project/current-state.md"),
        entry("路线图", "memory/project/roadmap.md")
      ]
    },
    {
      title: "任务清单",
      items: taskPaths.map((path) => entry(path.split("/").pop() ?? path, path))
    },
    {
      title: "记忆与 ADR",
      items: [
        entry("技术债", "memory/project/tech-debt.md"),
        entry("经验入口", "memory/experience/README.md"),
        ...experiencePaths
          .filter((path) => path !== "memory/experience/README.md")
          .slice(-1)
          .map((path) => entry(path.split("/").pop() ?? path, path)),
        ...decisionPaths.slice(-1).map((path) => entry(path.split("/").pop() ?? path, path))
      ]
    },
    {
      title: "模块索引",
      items: [
        entry("模块索引", "code_index/module-index.md"),
        entry("依赖图", "code_index/dependency-map.md")
      ]
    },
    {
      title: "角色职责",
      items: [
        entry("架构与职责", "docs/ARCHITECTURE.md"),
        entry("系统总览", "memory/architecture/system-overview.md")
      ]
    }
  ];
}

export function formatWorktreeStatus(value: string) {
  if (!value.trim()) {
    return "干净";
  }
  return value;
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
    up_to_date: "已同步"
  };
  return labels[value] ?? value;
}

function toOverviewSnippet(label: string, path: string, content: string): OverviewSnippet {
  return { label, path, content };
}

function entry(label: string, path: string): SemanticEntry {
  return { label, path };
}

function summarizeTaskTrace(task: { updateTrace: { memory: string; index: string; roadmap: string; docs: string } }): string {
  return [task.updateTrace.memory, task.updateTrace.index, task.updateTrace.roadmap, task.updateTrace.docs]
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");
}
