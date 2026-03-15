import { TASK_STATUS_LABELS } from "@/modules/tasks";
import type { BattleBoard, CompanySnapshot, OnboardingStep, SystemCard, TaskSummary } from "./types";
import { previewSection, splitChineseList } from "./parsing";

export function buildCompanySnapshot(
  agentsState: Record<string, string>,
  projectSnapshot: Record<string, string>,
  roadmapPhase: string,
): CompanySnapshot {
  return {
    oneLiner: agentsState["项目一句话"] ?? "项目一句话尚未写入主源。",
    currentPhase: projectSnapshot["当前阶段"] || roadmapPhase || "当前阶段尚未定义。",
    successDefinition: agentsState["成功定义"] ?? "成功定义尚未写入主源。",
    mustProtect: splitChineseList(agentsState["必须保护"] ?? ""),
  };
}

export function buildBattleBoard(
  currentPriority: string,
  roadmapPhase: string,
  currentFocus: string[],
  doingTasks: TaskSummary[],
  blockedTasks: TaskSummary[],
  nextCheckpoint: string[],
): BattleBoard {
  return {
    currentPriority: currentPriority || "当前优先级尚未定义。",
    currentMainline: roadmapPhase || "当前主线尚未定义。",
    currentFocus,
    doingTasks,
    blockedTasks,
    nextCheckpoint,
  };
}

export function buildSystemCards(
  tasks: TaskSummary[],
  moduleIndexContent: string,
  dependencyMapContent: string,
  activeReleaseId: string | null,
): SystemCard[] {
  return [
    {
      title: "执行入口",
      summary: "所有新线程先读 AGENTS，再进入 roadmap、task、module.md 和 code index，不重新发明规则。",
      href: "/knowledge-base?path=AGENTS.md",
    },
    {
      title: "任务系统",
      summary: `当前共有 ${tasks.length} 个活跃 task；每次可合并改动都必须绑定 task，并写清更新痕迹。`,
      href: "/tasks",
    },
    {
      title: "记忆系统",
      summary: "项目状态、经验、ADR 和技术债都落在 memory/*，先记忆、后升格，不把一次性判断直接写成长期规则。",
      href: "/knowledge-base?path=memory/project/current-state.md",
    },
    {
      title: "上下文索引",
      summary: `${previewSection(moduleIndexContent)} ${previewSection(dependencyMapContent)}`.trim(),
      href: "/knowledge-base?path=code_index/module-index.md",
    },
    {
      title: "发布系统",
      summary: activeReleaseId
        ? `当前活跃 release 为 ${activeReleaseId}，发布采用后台准备 + current 软链切换 + 可回滚模型。`
        : "发布采用后台准备 + current 软链切换 + 可回滚模型，当前还没有活跃 release 记录。",
      href: "/releases",
    },
  ];
}

export function buildOnboardingSteps(): OnboardingStep[] {
  return [
    {
      title: "先读 AGENTS",
      summary: "先建立统一工作顺序、当前主线和改动门禁。",
      href: "/knowledge-base?path=AGENTS.md",
    },
    {
      title: "看 roadmap / 当前状态",
      summary: "理解今天在打什么仗、当前阶段是什么、下一检查点在哪。",
      href: "/knowledge-base?path=memory/project/roadmap.md",
    },
    {
      title: "绑定 task",
      summary: "任何可合并改动都必须先进入 task，再开始实现和回写。",
      href: "/tasks",
    },
    {
      title: "补读 module / index",
      summary: "涉及具体模块时，再最小化补读 module.md、模块索引和依赖图。",
      href: "/knowledge-base?path=code_index/module-index.md",
    },
  ];
}

export function buildRiskCards(blockedTasks: TaskSummary[], techDebtContent: string, activeReleaseId: string | null): SystemCard[] {
  return [
    {
      title: "阻塞项",
      summary: blockedTasks.length
        ? blockedTasks.map((task) => `${task.title}（${task.status}）`).join("；")
        : "当前没有阻塞任务，主线可继续推进。",
      href: "/tasks",
    },
    {
      title: "技术债",
      summary: previewSection(techDebtContent, 2),
      href: "/knowledge-base?path=memory/project/tech-debt.md",
    },
    {
      title: "发布状态",
      summary: activeReleaseId
        ? `当前线上切到 ${activeReleaseId}；如改坏，可继续在 main 修复，或直接从发布页切回上一个健康 release。`
        : "当前还没有活跃 release 记录；生产切换依旧按后台准备完成后再原子切换。",
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
