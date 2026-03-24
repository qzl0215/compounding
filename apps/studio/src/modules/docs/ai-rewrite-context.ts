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
  const supportPaths = getSupportingDocPaths(args.path);
  const [roadmap, currentState, blueprint, ...supportDocs] = await Promise.all([
    readDoc("memory/project/roadmap.md"),
    readDoc("memory/project/current-state.md"),
    readDoc("memory/project/operating-blueprint.md"),
    ...supportPaths.map((path) => readDoc(path)),
  ]);
  const supportMap = new Map(supportPaths.map((path, index) => [path, supportDocs[index]?.content ?? ""]));

  const currentPriority = stripMarkdown(extractSection(roadmap.content, "current_priority") ?? "");
  const currentPhase = stripMarkdown(extractSection(roadmap.content, "current_phase") ?? "");
  const nextMilestone = stripMarkdown(extractSection(roadmap.content, "current_milestone") ?? "");
  const blueprintGoals = stripMarkdown(extractSection(blueprint.content, "plan_overview") ?? "");
  const currentFocus = stripMarkdown(extractSection(currentState.content, "current_focus") ?? "");
  const localEntry = stripMarkdown(extractSection(currentState.content, "本地入口") ?? "");
  const currentBlockers = stripMarkdown(extractSection(currentState.content, "current_blockers") ?? "");
  const frozenItems = stripMarkdown(extractSection(currentState.content, "frozen_items") ?? "");

  return {
    project: {
      one_liner: currentFocus || blueprintGoals || currentPriority,
      current_priority: currentPriority,
      current_phase: currentPhase,
      next_milestone: nextMilestone,
      operating_blueprint_summary: blueprintGoals,
      must_protect: frozenItems || currentBlockers || localEntry,
    },
    document: {
      path: args.path,
      title: args.title,
      doc_type: classifyDocType(args.path),
      body_markdown: args.content,
    },
    culture_principles: CULTURE_PRINCIPLES,
    best_practice_constraints: buildBestPracticeConstraints(args.path, supportMap),
    rewrite_intensity: args.intensity,
    user_supplement: args.answers,
  };
}

function buildBestPracticeConstraints(pathname: string, supportMap: Map<string, string>) {
  const shared = [
    "提高人类与 AI 的易读性",
    "避免重复与口语化表达",
    "不引入文档外事实",
    "不修改 frontmatter 与托管标记",
  ];
  const workModes = stripMarkdown(supportMap.get("docs/WORK_MODES.md") ?? "").slice(0, 500);
  const devWorkflow = stripMarkdown(supportMap.get("docs/DEV_WORKFLOW.md") ?? "").slice(0, 500);
  const architecture = stripMarkdown(supportMap.get("docs/ARCHITECTURE.md") ?? "").slice(0, 500);

  if (pathname.includes("roadmap") || pathname.includes("operating-blueprint")) {
    return [...shared, "规划文档要保留目标、边界、验收与阶段性顺序"];
  }
  if (pathname.includes("tasks/")) {
    return [...shared, "任务文档要保留执行合同：为什么现在、承接边界、完成定义、要做/不做、关键风险、测试策略与交付结果"];
  }
  if (pathname.includes("WORK_MODES")) {
    return [...shared, "工作模式文档只保留场景、输入、允许动作和退出条件，不重复 runbook、角色或发布说明。"];
  }
  if (pathname.includes("DEV_WORKFLOW")) {
    return [...shared, "开发工作流只保留 runbook、命令顺序和进入退出条件，不重复模式语义。", workModes].filter(
      (item): item is string => Boolean(item)
    );
  }
  if (pathname.includes("ARCHITECTURE")) {
    return [...shared, "架构文档只保留仓库拓扑、依赖方向、运行时拓扑和禁止调用方式，不混工作流说明。"];
  }
  if (pathname.includes("PROJECT_RULES")) {
    return [...shared, "项目规则文档只保留代码治理、兼容层、验证和发布专项规则，不充当默认入口。", architecture].filter(
      (item): item is string => Boolean(item)
    );
  }
  if (pathname.includes("AI_OPERATING_MODEL")) {
    return [
      ...shared,
      "AI 工作模型只保留 AI 如何处理问题的行为原则和最小脚本契约，不重复主干文档定义。",
      workModes,
      devWorkflow,
    ].filter((item): item is string => Boolean(item));
  }
  return shared;
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

function getSupportingDocPaths(pathname: string) {
  if (pathname.includes("DEV_WORKFLOW")) {
    return ["docs/WORK_MODES.md"];
  }
  if (pathname.includes("PROJECT_RULES")) {
    return ["docs/ARCHITECTURE.md"];
  }
  if (pathname.includes("AI_OPERATING_MODEL")) {
    return ["docs/WORK_MODES.md", "docs/DEV_WORKFLOW.md"];
  }
  return [];
}
