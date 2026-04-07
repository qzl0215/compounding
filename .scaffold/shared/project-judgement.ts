import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const headingAliases = require("../bootstrap/heading_aliases.json") as Record<string, string[]>;

export type ProjectJudgementStage = "thinking" | "planning" | "ready" | "doing" | "acceptance" | "released";

export type ProjectJudgementContract = {
  oneLiner: string;
  currentPhase: string;
  currentMilestone: string;
  currentPriority: string;
  successCriteria: string[];
  planOverview: string;
  thinkingBacklog: string[];
  planningBacklog: string[];
  planSummary: string;
  executionSummary: string;
  currentFocus: string[];
  blockers: string[];
  nextCheckpoint: string[];
  focusSummary: string;
  overallSummary: string;
  pendingAcceptance: string | null;
  runtimeAlert: string | null;
  healthSummary: string;
  conclusion: string;
  nextAction: string;
  activeStage: ProjectJudgementStage;
  recommendedSurface: {
    label: string;
    href: string;
    reason: string;
  };
  recommendedRead: {
    label: string;
    path: string;
    reason: string;
  };
};

type ProjectJudgementInput = {
  currentStateContent: string;
  goalsContent?: string;
  counts?: {
    total: number;
    planning: number;
    ready: number;
    doing: number;
    blocked: number;
    acceptance: number;
    released: number;
  };
  release?: {
    pendingAcceptance?: string | null;
    runtimeAlert?: string | null;
    activeReleaseId?: string | null;
    runtimeRunning?: boolean;
  };
};

export function buildProjectJudgementContract(input: ProjectJudgementInput): ProjectJudgementContract {
  const currentFocus = parseBulletList(extractSection(input.currentStateContent, "current_focus") ?? "");
  const blockers = summarizeBlockers(parseBulletList(extractSection(input.currentStateContent, "current_blockers") ?? ""));
  const nextCheckpoint = parseBulletList(extractSection(input.currentStateContent, "next_checkpoint") ?? "");
  const currentPhase = normalizeInline(extractSection(input.goalsContent ?? "", "当前阶段") ?? "") || "当前阶段尚未定义。";
  const currentPriority = normalizeInline(extractSection(input.goalsContent ?? "", "当前优先级") ?? "") || "当前优先级尚未定义。";
  const currentMilestone =
    normalizeInline(extractSection(input.goalsContent ?? "", "当前里程碑") ?? "") || currentPhase || "当前里程碑尚未定义。";
  const successCriteria = parseBulletList(extractSection(input.goalsContent ?? "", "里程碑成功标准") ?? "");
  const planOverview = normalizeInline(extractSection(input.goalsContent ?? "", "需求总览") ?? "");
  const thinkingBacklog = parseBulletList(extractSection(input.goalsContent ?? "", "待思考") ?? "");
  const planningBacklog = parseBulletList(extractSection(input.goalsContent ?? "", "待规划") ?? "");
  const counts = input.counts ?? {
    total: 0,
    planning: 0,
    ready: 0,
    doing: 0,
    blocked: 0,
    acceptance: 0,
    released: 0,
  };
  const pendingAcceptance = normalizeOptional(input.release?.pendingAcceptance);
  const runtimeAlert = normalizeOptional(input.release?.runtimeAlert);
  const runtimeRunning = Boolean(input.release?.runtimeRunning);
  const activeReleaseId = normalizeOptional(input.release?.activeReleaseId);
  const activeStage = resolveProjectStateStage(thinkingBacklog, planningBacklog, counts, pendingAcceptance);
  const normalizedSuccessCriteria = summarizeSuccessCriteria(successCriteria, currentPriority, currentMilestone, planOverview);
  const planSummary = summarizePlan(planOverview, planningBacklog, thinkingBacklog);
  const executionSummary = summarizeExecution(counts.doing, counts.ready);
  const focusSummary = summarizeFocus(currentFocus, nextCheckpoint, currentPriority);
  const healthSummary = summarizeHealth(blockers, pendingAcceptance, runtimeAlert);
  const conclusion = summarizeReleaseConclusion(runtimeRunning, activeReleaseId, pendingAcceptance);
  const nextAction = summarizeReleaseNextAction(runtimeRunning, activeReleaseId, pendingAcceptance, blockers, nextCheckpoint, activeStage);

  return {
    oneLiner: summarizeOneLiner(planOverview, currentPriority, currentMilestone),
    currentPhase,
    currentMilestone,
    currentPriority,
    successCriteria: normalizedSuccessCriteria,
    planOverview,
    thinkingBacklog,
    planningBacklog,
    planSummary,
    executionSummary,
    currentFocus,
    blockers,
    nextCheckpoint,
    focusSummary,
    overallSummary: summarizeHeadline(currentFocus, currentPriority, planOverview, pendingAcceptance, runtimeAlert),
    pendingAcceptance,
    runtimeAlert,
    healthSummary,
    conclusion,
    nextAction,
    activeStage,
    recommendedSurface: resolveRecommendedSurface(activeStage, blockers, pendingAcceptance, runtimeAlert, counts),
    recommendedRead: resolveRecommendedRead(activeStage, blockers, currentFocus),
  };
}

function resolveProjectStateStage(
  thinkingBacklog: string[],
  planningBacklog: string[],
  counts: Required<ProjectJudgementInput>["counts"],
  pendingAcceptance: string | null,
): ProjectJudgementStage {
  if (pendingAcceptance || counts.acceptance > 0) return "acceptance";
  if (counts.doing > 0 || counts.blocked > 0) return "doing";
  if (counts.ready > 0) return "ready";
  if (counts.planning > 0) return "planning";
  if (planningBacklog.length > 0) return "planning";
  if (thinkingBacklog.length > 0) return "thinking";
  return "released";
}

function resolveRecommendedSurface(
  activeStage: ProjectJudgementStage,
  blockers: string[],
  pendingAcceptance: string | null,
  runtimeAlert: string | null,
  counts: Required<ProjectJudgementInput>["counts"],
) {
  if (pendingAcceptance || runtimeAlert) {
    return {
      label: "发布页",
      href: "/releases",
      reason: "当前判断先看验收与运行态，不要继续堆改动。",
    };
  }
  if (blockers.length > 0 || counts.doing > 0 || counts.ready > 0 || activeStage === "doing" || activeStage === "ready") {
    return {
      label: "任务页",
      href: "/tasks",
      reason: "当前需要先看执行事项、阻塞和待处理子任务。",
    };
  }
  return {
    label: "目标",
    href: "/knowledge-base?path=memory/project/goals.md",
    reason: "当前更适合先收口边界与下一步，再进入执行。",
  };
}

function resolveRecommendedRead(activeStage: ProjectJudgementStage, blockers: string[], currentFocus: string[]) {
  if (blockers.length > 0 || currentFocus.length > 0) {
    return {
      label: "当前状态",
      path: "memory/project/current-state.md",
      reason: "这里保留了当前焦点、阻塞和下一检查点。",
    };
  }
  if (activeStage === "planning" || activeStage === "thinking") {
    return {
      label: "目标",
      path: "memory/project/goals.md",
      reason: "先看计划边界和待规划事项，避免直接开干。",
    };
  }
  return {
    label: "目标",
    path: "memory/project/goals.md",
    reason: "先回到阶段、里程碑和成功标准。",
  };
}

function summarizePlan(planOverview: string, planningBacklog: string[], thinkingBacklog: string[]) {
  if (planningBacklog.length > 0 || thinkingBacklog.length > 0) {
    return `待规划 ${planningBacklog.length} 项，待思考 ${thinkingBacklog.length} 项。先收口边界，再进入执行。`;
  }
  return simplifyHumanSentence(planOverview) || "当前计划边界已收口，可继续看执行事项。";
}

function summarizeExecution(doingCount: number, readyCount: number) {
  if (doingCount > 0) {
    return `当前有 ${doingCount} 项在推进，细节看执行面板。`;
  }
  if (readyCount > 0) {
    return `当前有 ${readyCount} 项可开工，先看执行面板。`;
  }
  return "当前没有新的执行事项，先看计划边界或验收与运行。";
}

function summarizeFocus(currentFocus: string[], nextCheckpoint: string[], currentPriority: string) {
  return (
    simplifyHumanSentence(currentFocus[0]) ||
    simplifyHumanSentence(nextCheckpoint[0]) ||
    simplifyHumanSentence(currentPriority) ||
    "当前焦点尚未写入。"
  );
}

function summarizeHealth(blockers: string[], pendingAcceptance: string | null, runtimeAlert: string | null) {
  if (blockers.length > 0) return "当前有阻塞，先处理当前焦点和提醒。";
  if (pendingAcceptance) return "当前有待验收版本，先做判断再继续推进。";
  if (runtimeAlert) return "当前运行存在异常，先恢复运行态。";
  return "当前无待验收版本，运行正常，可继续按当前焦点推进。";
}

function summarizeReleaseConclusion(runtimeRunning: boolean, activeReleaseId: string | null, pendingAcceptance: string | null) {
  if (pendingAcceptance) {
    return "现在该验收，不该继续堆改动。";
  }
  if (runtimeRunning) {
    return `当前 production 在线，运行版本 ${activeReleaseId || "未知"}。`;
  }
  return "当前先确认运行态，再讨论继续发布。";
}

function summarizeReleaseNextAction(
  runtimeRunning: boolean,
  activeReleaseId: string | null,
  pendingAcceptance: string | null,
  blockers: string[],
  nextCheckpoint: string[],
  activeStage: ProjectJudgementStage,
) {
  if (pendingAcceptance) {
    return "先验收当前版本，通过或驳回后再继续推进。";
  }
  if (blockers.length > 0) {
    return simplifyHumanSentence(blockers[0]) || "先处理当前阻塞，再继续推进。";
  }
  if (runtimeRunning) {
    return `当前线上版本 ${activeReleaseId || "已激活"} 可用；如需继续推进，先生成新的 dev 预览。`;
  }
  if (activeStage === "planning" || activeStage === "thinking") {
    return simplifyHumanSentence(nextCheckpoint[0]) || "先把计划边界和下一步收口，再进入执行。";
  }
  return simplifyHumanSentence(nextCheckpoint[0]) || "先看任务页确认当前执行事项，再决定下一步。";
}

function summarizeOneLiner(planOverview: string, currentPriority: string, currentMilestone: string) {
  return (
    simplifyHumanSentence(currentPriority) ||
    simplifyHumanSentence(planOverview) ||
    simplifyHumanSentence(currentMilestone) ||
    "项目一句话目标尚未写入。"
  );
}

function summarizeHeadline(
  currentFocus: string[],
  currentPriority: string,
  planOverview: string,
  pendingAcceptance: string | null,
  runtimeAlert: string | null,
) {
  if (pendingAcceptance) return `${pendingAcceptance}，先完成验收判断。`;
  if (runtimeAlert) return runtimeAlert;
  return (
    simplifyHumanSentence(currentFocus[0]) ||
    simplifyHumanSentence(currentPriority) ||
    simplifyHumanSentence(planOverview) ||
    "当前焦点尚未写入。"
  );
}

function summarizeSuccessCriteria(successCriteria: string[], currentPriority: string, currentMilestone: string, planOverview: string) {
  const normalized = successCriteria
    .map((item) => normalizeSuccessCriterion(item))
    .filter((item): item is string => Boolean(item));
  if (normalized.length > 0) {
    return normalized.slice(0, 3);
  }
  const fallback = simplifyHumanSentence(currentPriority) || simplifyHumanSentence(currentMilestone) || simplifyHumanSentence(planOverview);
  return [fallback || "当前成功标准尚未写入。"];
}

function normalizeSuccessCriterion(value: string) {
  const text = simplifyHumanSentence(value);
  if (!text) return null;
  if (text.includes("首屏不滚动即可回答")) return "首屏能回答目标、阶段、风险和下一步";
  if (text.includes("逻辑结构图")) return "首页主视觉是可点击的逻辑结构图";
  if (text.includes("退出首页") || text.includes("不再")) return "首页不再平铺工程内部对象";
  if (text.includes("不新增新状态源") || text.includes("重型框架") || text.includes("图形库")) return null;
  return text;
}

function summarizeBlockers(blockers: string[]) {
  const normalized = blockers.map((item) => normalizeBlocker(item)).filter((item): item is string => Boolean(item));
  return Array.from(new Set(normalized));
}

function normalizeBlocker(value: string) {
  const text = normalizeInline(value).replace(/`/g, "");
  if (!text) return null;
  if (text.includes("没有发布阻塞")) return "保持首页、任务页和发布页共享同一份判断摘要。";
  if (text.includes("只换视觉") || text.includes("回流")) return "避免只改视觉不改判断链，防止旧结构回流。";
  return simplifyHumanSentence(text);
}

function simplifyHumanSentence(value: string | null | undefined) {
  if (!value) return "";

  let text = normalizeInline(value).replace(/`/g, "");
  text = text.replace(/^t-\d+\s*(正在推进|已完成|仍在待续主线)?[:：]\s*/i, "");
  text = text.replace(/^当前主线切到\s*/u, "");
  text = text.replace(/Kernel\s*\/\s*Project/gi, "旧首页");
  text = text.replace(/\bold\b/gi, "旧");
  text = text.replace(/artifact health/gi, "工程状态");
  text = text.replace(/boundary groups/gi, "工程分组");
  text = text.replace(/\s+/g, " ").trim();

  if (text.includes("首页") && text.includes("逻辑态势图")) {
    return "把首页收成人类可扫读的项目逻辑态势图。";
  }

  return text.split(/[；。]/u).map((part) => part.trim()).find(Boolean) || text;
}

function extractSection(content: string, keyOrHeading: string) {
  const sections = parseMarkdownSections(content);
  const aliases = resolveHeadingAliases(keyOrHeading);
  for (const alias of aliases) {
    if (sections[alias]) {
      return sections[alias];
    }
  }
  return null;
}

function parseMarkdownSections(markdown: string) {
  const sections: Record<string, string[]> = { __root__: [] };
  let current = "__root__";
  for (const line of String(markdown || "").split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      current = heading[1].trim();
      sections[current] = [];
      continue;
    }
    sections[current].push(line);
  }
  return Object.fromEntries(Object.entries(sections).map(([key, lines]) => [key, lines.join("\n").trim()]));
}

function resolveHeadingAliases(keyOrHeading: string) {
  const direct = headingAliases[keyOrHeading];
  if (direct) {
    return direct;
  }
  const target = normalizeHeading(keyOrHeading);
  for (const aliases of Object.values(headingAliases)) {
    if (aliases.some((alias) => normalizeHeading(alias) === target)) {
      return aliases;
    }
  }
  return [keyOrHeading];
}

function normalizeHeading(value: string) {
  return String(value || "").trim().toLowerCase();
}

function parseBulletList(content: string) {
  return String(content || "")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^-+\s*/, ""))
    .map((line) => stripMarkdown(line))
    .filter(Boolean);
}

function normalizeInline(value: string) {
  return stripMarkdown(value).replace(/\s+/g, " ").trim();
}

function stripMarkdown(value: string) {
  return String(value || "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^#+\s+/gm, "")
    .trim();
}

function normalizeOptional(value: string | null | undefined) {
  const normalized = normalizeInline(String(value || ""));
  return normalized || null;
}
