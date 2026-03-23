import { readDoc } from "@/modules/docs/repository";
import { extractSection, stripMarkdown } from "@/modules/docs/sections";
import type { RewriteIntensity } from "./ai-rewrite-types";

const CULTURE_PRINCIPLES = [
  "规则服务于效率，不服务于扩张",
  "task 是边界，不是审批流",
  "roadmap 只记录主线变化",
  "记忆只记录可复用经验和明确裁决",
  "若规范本身限制复利效率，可直接简化规范",
];

export async function buildRewriteContext(args: {
  path: string;
  title: string;
  content: string;
  intensity: RewriteIntensity;
  answers: string;
}) {
  const [roadmap, currentState, blueprint, workModes, projectRules] = await Promise.all([
    readDoc("memory/project/roadmap.md"),
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/operating-blueprint.md"),
    readDoc("docs/WORK_MODES.md"),
    readDoc("docs/PROJECT_RULES.md"),
  ]);

  const currentPriority = stripMarkdown(extractSection(roadmap.content, "current_priority") ?? "");
  const currentPhase = stripMarkdown(extractSection(roadmap.content, "current_phase") ?? "");
  const nextMilestone = stripMarkdown(extractSection(roadmap.content, "current_milestone") ?? "");
  const blueprintGoals = stripMarkdown(extractSection(blueprint.content, "plan_overview") ?? "");
  const projectSnapshot = stripMarkdown(extractSection(currentState.content, "project_snapshot") ?? "");
  const currentFocus = stripMarkdown(extractSection(currentState.content, "current_focus") ?? "");
  const missionVision = stripMarkdown(extractSection(currentState.content, "mission_and_vision") ?? "");
  const frozenItems = stripMarkdown(extractSection(currentState.content, "frozen_items") ?? "");

  return {
    project: {
      one_liner: missionVision || currentFocus || projectSnapshot,
      current_priority: currentPriority,
      current_phase: currentPhase,
      next_milestone: nextMilestone,
      operating_blueprint_summary: blueprintGoals,
      must_protect: frozenItems,
    },
    document: {
      path: args.path,
      title: args.title,
      doc_type: classifyDocType(args.path),
      body_markdown: args.content,
    },
    culture_principles: CULTURE_PRINCIPLES,
    best_practice_constraints: buildBestPracticeConstraints(args.path, projectRules.content, workModes.content),
    rewrite_intensity: args.intensity,
    user_supplement: args.answers,
  };
}

function buildBestPracticeConstraints(pathname: string, projectRules: string, workModes: string) {
  const shared = [
    "提高人类与 AI 的易读性",
    "避免重复与口语化表达",
    "不引入文档外事实",
    "不修改 frontmatter 与托管标记",
  ];

  if (pathname.includes("roadmap") || pathname.includes("operating-blueprint")) {
    return [...shared, "规划文档要保留目标、边界、验收与阶段性顺序"];
  }
  if (pathname.includes("tasks/")) {
    return [...shared, "任务文档要保留执行合同：为什么现在、承接边界、完成定义、要做/不做、关键风险、测试策略与交付结果"];
  }
  if (pathname.includes("WORK_MODES")) {
    return [...shared, "工作模式文档要强调输入、输出、进入退出条件与边界，不得混入无关说明", stripMarkdown(workModes).slice(0, 600)];
  }
  if (pathname.includes("ARCHITECTURE")) {
    return [...shared, "架构文档要强调模块边界、依赖与禁止调用方式，不得混入无关说明", stripMarkdown(projectRules).slice(0, 600)];
  }
  return [...shared, stripMarkdown(projectRules).slice(0, 600)];
}

function classifyDocType(pathname: string) {
  if (pathname === "AGENTS.md") return "agents";
  if (pathname.includes("roadmap")) return "roadmap";
  if (pathname.includes("operating-blueprint")) return "operating-blueprint";
  if (pathname.includes("tasks/")) return "task";
  if (pathname.includes("WORK_MODES")) return "work-modes";
  if (pathname.includes("ARCHITECTURE")) return "architecture";
  if (pathname.includes("memory/")) return "memory";
  return "generic";
}
