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
  docRole: string;
  content: string;
  intensity: RewriteIntensity;
  answers: string;
}) {
  const [agents, roadmap, currentState, blueprint, orgModel, workModes, projectRules] = await Promise.all([
    readDoc("AGENTS.md"),
    readDoc("memory/project/roadmap.md"),
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/operating-blueprint.md"),
    readDoc("docs/ORG_MODEL.md"),
    readDoc("docs/WORK_MODES.md"),
    readDoc("docs/PROJECT_RULES.md"),
  ]);

  const currentPriority = stripMarkdown(extractSection(agents.content, "current_priority") ?? "");
  const currentPhase = stripMarkdown(extractSection(roadmap.content, "current_phase") ?? "");
  const nextMilestone = stripMarkdown(extractSection(roadmap.content, "next_milestone") ?? "");
  const blueprintGoals = stripMarkdown(extractSection(blueprint.content, "key_sub_goals") ?? "");
  const projectSnapshot = stripMarkdown(extractSection(currentState.content, "project_snapshot") ?? "");
  const missionVision = stripMarkdown(extractSection(currentState.content, "使命与愿景") ?? "");

  return {
    project: {
      one_liner: missionVision || projectSnapshot,
      current_priority: currentPriority,
      current_phase: currentPhase,
      next_milestone: nextMilestone,
      operating_blueprint_summary: blueprintGoals,
      must_protect: projectSnapshot,
    },
    document: {
      path: args.path,
      title: args.title,
      doc_role: args.docRole,
      doc_type: classifyDocType(args.path, args.docRole),
      body_markdown: args.content,
    },
    culture_principles: CULTURE_PRINCIPLES,
    best_practice_constraints: buildBestPracticeConstraints(args.path, args.docRole, projectRules.content, orgModel.content, workModes.content),
    rewrite_intensity: args.intensity,
    user_supplement: args.answers,
  };
}

function buildBestPracticeConstraints(pathname: string, docRole: string, projectRules: string, orgModel: string, workModes: string) {
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
    return [...shared, "任务文档要保留目标、范围、约束、验收标准与更新痕迹"];
  }
  if (pathname.includes("WORK_MODES")) {
    return [...shared, "工作模式文档要强调输入、输出、进入退出条件与边界，不得混入角色职责正文", stripMarkdown(workModes).slice(0, 600)];
  }
  if (pathname.includes("ORG_MODEL") || docRole === "reference") {
    return [...shared, "组织文档要强调职责、产物和介入时机，避免散文式描述", stripMarkdown(orgModel).slice(0, 600)];
  }
  return [...shared, stripMarkdown(projectRules).slice(0, 600)];
}

function classifyDocType(pathname: string, docRole: string) {
  if (pathname === "AGENTS.md") return "agents";
  if (pathname.includes("roadmap")) return "roadmap";
  if (pathname.includes("operating-blueprint")) return "operating-blueprint";
  if (pathname.includes("tasks/")) return "task";
  if (pathname.includes("ORG_MODEL")) return "org";
  if (pathname.includes("WORK_MODES")) return "work-modes";
  if (pathname.includes("ARCHITECTURE")) return "architecture";
  if (pathname.includes("memory/")) return "memory";
  return docRole || "generic";
}
