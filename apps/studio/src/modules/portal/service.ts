import { extractFirstHeading, extractSection, listDocsUnder, readDoc, stripMarkdown } from "@/modules/docs";
import type { HomeEntryLink, OverviewSnippet, PortalOverview, SemanticEntry, SemanticEntryGroup, TaskSummary } from "./types";

export const DEFAULT_DOC_PATH = "AGENTS.md";

export const HOME_ENTRY_LINKS: HomeEntryLink[] = [
  { href: "/knowledge-base?path=AGENTS.md", label: "打开 AGENTS", scope: "agents" },
  { href: "/knowledge-base?path=memory/project/roadmap.md", label: "查看路线图", scope: "roadmap" },
  { href: "/knowledge-base?path=memory/project/current-state.md", label: "查看当前状态", scope: "memory" }
];

export async function getPortalOverview(): Promise<PortalOverview> {
  const [agents, architecture, currentState, roadmap, techDebt, moduleIndex, dependencyMap, taskPaths, experiencePaths, decisionPaths] =
    await Promise.all([
      readDoc("AGENTS.md"),
      readDoc("docs/ARCHITECTURE.md"),
      readDoc("memory/project/current-state.md"),
      readDoc("memory/project/roadmap.md"),
      readDoc("memory/project/tech-debt.md"),
      readDoc("code_index/module-index.md"),
      readDoc("code_index/dependency-map.md"),
      listDocsUnder("tasks/queue"),
      listDocsUnder("memory/experience"),
      listDocsUnder("memory/decisions")
    ]);

  const recentExperiencePath = experiencePaths.filter((path) => path !== "memory/experience/README.md").slice(-1)[0];
  const recentDecisionPath = decisionPaths.slice(-1)[0];
  const taskDocs = await Promise.all(taskPaths.map((path) => readDoc(path)));
  const memorySnippets: OverviewSnippet[] = [
    toOverviewSnippet("项目状态", "memory/project/current-state.md", extractSection(currentState.content, "Project Snapshot") ?? currentState.content),
    toOverviewSnippet("技术债", "memory/project/tech-debt.md", extractSection(techDebt.content, "Active Debt") ?? techDebt.content)
  ];

  if (recentExperiencePath) {
    const experienceDoc = await readDoc(recentExperiencePath);
    memorySnippets.push(toOverviewSnippet("最近经验", recentExperiencePath, extractSection(experienceDoc.content, "Decision") ?? experienceDoc.content));
  }
  if (recentDecisionPath) {
    const decisionDoc = await readDoc(recentDecisionPath);
    memorySnippets.push(toOverviewSnippet("最近 ADR", recentDecisionPath, extractSection(decisionDoc.content, "Decision") ?? decisionDoc.content));
  }

  return {
    projectIntro: extractSection(agents.content, "Current State"),
    currentFocus: extractSection(currentState.content, "Current Focus"),
    roadmap: roadmap.content,
    tasks: taskPaths.map((path, index) => toTaskSummary(path, taskDocs[index].content)),
    memory: memorySnippets,
    index: [
      toOverviewSnippet("模块索引", "code_index/module-index.md", extractSection(moduleIndex.content, "apps/studio/src/modules") ?? moduleIndex.content),
      toOverviewSnippet("依赖方向", "code_index/dependency-map.md", extractSection(dependencyMap.content, "Allowed Direction") ?? dependencyMap.content)
    ],
    roleOverview: extractSection(architecture.content, "Operating Roles")
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
      title: "项目介绍",
      description: "先理解这是什么仓库、怎么读、怎么工作。",
      items: [
        entry("AGENTS 入口", "AGENTS.md", "唯一高频主源与开工协议"),
        entry("项目规则", "docs/PROJECT_RULES.md", "代码治理、命名、体量与清理规则"),
        entry("AI 工作模型", "docs/AI_OPERATING_MODEL.md", "AI 标准工作流与上下文构建")
      ]
    },
    {
      title: "当前主线",
      description: "先看项目状态，再看阶段路线图。",
      items: [
        entry("当前状态", "memory/project/current-state.md", "项目快照、当前焦点与检查点"),
        entry("路线图", "memory/project/roadmap.md", "当前优先级、验收梯子与执行 TODO")
      ]
    },
    {
      title: "待办任务",
      description: "按任务驱动阅读和改动，不直接撞整仓。",
      items: taskPaths.map((path) => entry(path.split("/").pop() ?? path, path, "当前任务队列中的可执行项"))
    },
    {
      title: "组织记忆",
      description: "先读状态，再读经验和 ADR，避免重复踩坑。",
      items: [
        entry("技术债", "memory/project/tech-debt.md", "未删净问题与删除计划"),
        entry("经验入口", "memory/experience/README.md", "经验如何记录、验证与升格"),
        ...experiencePaths
          .filter((path) => path !== "memory/experience/README.md")
          .slice(-1)
          .map((path) => entry(path.split("/").pop() ?? path, path, "最近一条可复用经验")),
        ...decisionPaths.slice(-1).map((path) => entry(path.split("/").pop() ?? path, path, "最近一条已确认 ADR"))
      ]
    },
    {
      title: "模块索引",
      description: "先看模块入口和依赖方向，再决定读哪些代码。",
      items: [
        entry("模块索引", "code_index/module-index.md", "模块域与阅读入口"),
        entry("依赖图", "code_index/dependency-map.md", "允许依赖方向与禁止调用方向")
      ]
    },
    {
      title: "代理职责",
      description: "先理解谁负责什么，再分配 agent 工作边界。",
      items: [
        entry("架构与职责", "docs/ARCHITECTURE.md", "仓库形态、模块边界与运行角色"),
        entry("系统总览", "memory/architecture/system-overview.md", "系统目标、模块职责与禁止调用方式")
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

function toTaskSummary(path: string, content: string): TaskSummary {
  return {
    path,
    title: extractFirstHeading(content) ?? path.split("/").pop() ?? path,
    goal: stripMarkdown(extractSection(content, "Goal") ?? "当前任务尚未填写 Goal。"),
    status: stripMarkdown(extractSection(content, "Status") ?? "todo")
  };
}

function toOverviewSnippet(label: string, path: string, content: string): OverviewSnippet {
  return { label, path, content };
}

function entry(label: string, path: string, description: string): SemanticEntry {
  return { label, path, description };
}
