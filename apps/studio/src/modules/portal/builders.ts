import { getRuntimeStatusExplanation, type LocalRuntimeStatus } from "@/modules/releases";
import { TASK_STATUS_LABELS } from "@/modules/tasks";
import type {
  CockpitCurrentFocus,
  CockpitEvidenceGroup,
  CockpitExecutionStatus,
  CockpitIdentity,
  CockpitRiskBoard,
  CockpitRiskItem,
  CockpitRiskTone,
  CockpitRuntimeSignal,
  TaskSummary,
} from "./types";

export function buildIdentitySnapshot(
  agentsState: Record<string, string>,
  missionAndVision: Record<string, string>,
): CockpitIdentity {
  return {
    oneLiner: agentsState["项目一句话"] ?? missionAndVision["使命"] ?? "项目一句话尚未写入主源。",
    mission: missionAndVision["使命"] || agentsState["使命"] || "使命尚未定义。",
    successDefinition: agentsState["成功定义"] ?? "成功定义尚未写入主源。",
    mustProtect: splitChineseList(agentsState["必须保护"] ?? ""),
  };
}

export function buildCurrentFocus(
  currentPhase: string,
  currentPriority: string,
  currentMilestone: string,
  successCriteria: string[],
): CockpitCurrentFocus {
  return {
    currentPhase: currentPhase || "当前阶段尚未定义。",
    currentPriority: currentPriority || "当前优先级尚未定义。",
    currentMilestone: currentMilestone || "当前里程碑尚未定义。",
    successCriteria,
  };
}

export function buildExecutionStatus(
  currentMilestone: string,
  doingTasks: TaskSummary[],
  blockedItems: string[],
  nextCheckpoint: string[],
  runtimeSignals: CockpitRuntimeSignal[],
): CockpitExecutionStatus {
  const progressSummary = doingTasks.length
    ? `当前有 ${doingTasks.length} 项任务在推进，首页默认展示最需要人工继续跟进的事项。`
    : "当前没有标记为进行中的任务，建议先确认下一步是否需要补 task 或重排优先级。";

  return {
    headline: currentMilestone || "当前推进主线尚未定义。",
    summary: `${progressSummary} 运行态摘要和下一检查点会一起展示，避免人只看任务不看环境。`,
    doingTasks,
    blockedItems,
    nextCheckpoint,
    runtimeSignals,
  };
}

export function buildRiskBoard(
  factConflicts: string[],
  frozenItems: string[],
  pendingDevReleaseId: string | null,
  activeReleaseId: string | null,
  previewRuntime: LocalRuntimeStatus,
  productionRuntime: LocalRuntimeStatus,
): CockpitRiskBoard {
  return {
    factConflicts,
    frozenItems,
    items: [
      {
        title: "待验收版本",
        summary: pendingDevReleaseId
          ? `当前存在待验收 dev：${pendingDevReleaseId}。继续推进新改动前，建议先完成这轮验收判断。`
          : activeReleaseId
            ? `当前没有待验收 dev。已激活的 production 版本是 ${activeReleaseId}。`
            : "当前没有待验收 dev，也还没有激活的 production 版本。",
        tone: pendingDevReleaseId ? "warning" : "stable",
        href: "/releases",
      },
      toRuntimeRiskItem("dev 预览", previewRuntime),
      toRuntimeRiskItem("production", productionRuntime),
    ],
  };
}

export function buildEvidenceLinks(): CockpitEvidenceGroup[] {
  return [
    {
      title: "主源文档",
      items: [
        {
          title: "AGENTS",
          summary: "高频执行入口，先回答这是什么项目、当前优先级和协作硬规则。",
          href: "/knowledge-base?path=AGENTS.md",
        },
        {
          title: "路线图",
          summary: "回答当前阶段和下个里程碑，不承接执行细节。",
          href: "/knowledge-base?path=memory/project/roadmap.md",
        },
        {
          title: "运营蓝图",
          summary: "回答当前里程碑拆成哪几个子目标，以及每个子目标的发布标准。",
          href: "/knowledge-base?path=memory/project/operating-blueprint.md",
        },
        {
          title: "当前状态",
          summary: "回答这轮项目当前焦点、冻结项和最近检查点。",
          href: "/knowledge-base?path=memory/project/current-state.md",
        },
      ],
    },
    {
      title: "详情工作台",
      items: [
        {
          title: "任务详情",
          summary: "查看任务边界、Git 事实、更新痕迹和执行上下文。",
          href: "/tasks",
        },
        {
          title: "文档详情",
          summary: "下钻到规则、架构、记忆、prompt 和 task 原文。",
          href: "/knowledge-base",
        },
        {
          title: "发布详情",
          summary: "查看待验收 dev、production 运行态和回滚入口。",
          href: "/releases",
        },
      ],
    },
    {
      title: "辅助理解",
      items: [
        {
          title: "工作模式",
          summary: "查看需求提出到发布复盘的业务链，理解当前应该用哪种脑力。",
          href: "/knowledge-base?path=docs/WORK_MODES.md",
        },
        {
          title: "组织职责",
          summary: "查看角色职责边界，避免把工作模式和组织镜头混在一起。",
          href: "/knowledge-base?path=docs/ORG_MODEL.md",
        },
        {
          title: "代码索引",
          summary: "需要下钻到实现时，从模块索引进入而不是盲读整个仓库。",
          href: "/knowledge-base?path=code_index/module-index.md",
        },
      ],
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

export function toRuntimeSignal(label: string, runtime: LocalRuntimeStatus): CockpitRuntimeSignal {
  const exp = getRuntimeStatusExplanation(runtime.status, label, runtime);
  const summary =
    exp.tone === "stable" ? exp.explanation : `${exp.explanation} 下一步：${exp.nextStep}`;
  return {
    label,
    status: exp.humanLabel,
    summary,
    href: "/releases#runtime-status",
  };
}

function summarizeTaskTrace(task: { updateTrace: { memory: string; index: string; roadmap: string; docs: string } }) {
  return [task.updateTrace.memory, task.updateTrace.index, task.updateTrace.roadmap, task.updateTrace.docs]
    .filter(Boolean)
    .slice(0, 2)
    .join(" / ");
}

function toRuntimeRiskItem(label: string, runtime: LocalRuntimeStatus): CockpitRiskItem {
  const exp = getRuntimeStatusExplanation(runtime.status, label, runtime);
  const summary =
    exp.tone === "stable" ? exp.explanation : `${exp.explanation} 下一步：${exp.nextStep}`;
  return {
    title: `${label} 运行态`,
    summary,
    tone: exp.tone,
    href: "/releases#runtime-status",
  };
}


function splitChineseList(value: string) {
  return value
    .split(/[，,、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
