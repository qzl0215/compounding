import { execFileSync } from "node:child_process";
import { getWorkspaceRoot } from "../../lib/workspace";
import { VALIDATION_LAYERS, type ValidationLayer } from "../releases/validation";
import type { DiffAwareArtifact, DiffAwareCategory, DiffAwareCheckLayer } from "./types";

type DiffStats = {
  files: number;
  insertions: number;
  deletions: number;
};

type FileImpact = {
  file: string;
  risk: "low" | "medium" | "high";
  category: string;
  focus: string[];
  evidencePoints: string[];
  takeaway: string;
  layerHints: ValidationLayer["id"][];
};

export function collectDiffAwareArtifact(): DiffAwareArtifact {
  const { changedFiles, stats } = readDiffSnapshot();
  return buildDiffAwareArtifactFromFiles(changedFiles, stats);
}

export function buildDiffAwareArtifactFromFiles(changedFiles: string[], stats: DiffStats): DiffAwareArtifact {
  const impacts = changedFiles.map((file) => analyzeFileImpact(file));
  const categories = buildCategories(impacts);
  const healthScore = calculateHealthScore(changedFiles, impacts, stats);
  const suggestedChecks = selectSuggestedChecks(impacts);
  const scopeSummary = buildScopeSummary(changedFiles, categories, stats);
  const reviewSummary = buildReviewSummary(scopeSummary, healthScore, suggestedChecks, categories);
  const retroSummary = buildRetroSummary(categories, healthScore);
  const shipLog = buildShipLog(scopeSummary, suggestedChecks, reviewSummary, retroSummary, healthScore);
  const evidencePoints = dedupe([
    ...impacts.flatMap((impact) => impact.evidencePoints),
    ...suggestedChecks.flatMap((layer) => layer.commands),
  ]);
  const nextActions = buildNextActions(healthScore, suggestedChecks, changedFiles.length);

  return {
    state: changedFiles.length === 0 ? "clean" : "dirty",
    summary:
      changedFiles.length === 0
        ? "当前没有新的 diff，暂不需要新增 QA / Review / Retro 产物。"
        : `本次改动涉及 ${changedFiles.length} 个文件，健康评分 ${healthScore.score}/100 (${healthScore.grade} 级) - ${healthScore.reason}`,
    scopeSummary,
    reviewSummary,
    retroSummary,
    shipLog,
    suggestedChecks,
    evidencePoints,
    nextActions,
    changedFiles,
    categories,
    healthScore,
    stats,
  };
}

function readDiffSnapshot() {
  const status = git(["status", "--short"]);
  if (status) {
    const changedFiles = dedupe(
      status
        .split("\n")
        .map((line) => {
          const match = line.match(/^.. (.+)$/);
          if (!match) return null;
          const value = match[1].trim();
          return value.includes(" -> ") ? value.split(" -> ").at(-1)?.trim() ?? null : value;
        })
        .filter((value): value is string => Boolean(value))
    );
    return {
      changedFiles,
      stats: getDiffStatsFromFiles(changedFiles),
    };
  }

  const branch = currentBranch();
  const range = branch && branch !== "main" ? `${git(["merge-base", "HEAD", "main"])}..HEAD` : "HEAD^..HEAD";
  const changedFiles = dedupe(
    git(["diff", "--name-only", range])
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  );
  return {
    changedFiles,
    stats: getDiffStatsFromRange(range),
  };
}

function getDiffStatsFromFiles(files: string[]): DiffStats {
  if (files.length === 0) {
    return { files: 0, insertions: 0, deletions: 0 };
  }
  const unstaged = summarizeNumStat(git(["diff", "--numstat"]));
  const staged = summarizeNumStat(git(["diff", "--numstat", "--cached"]));
  return {
    files: Math.max(files.length, unstaged.files + staged.files),
    insertions: unstaged.insertions + staged.insertions,
    deletions: unstaged.deletions + staged.deletions,
  };
}

function getDiffStatsFromRange(range: string): DiffStats {
  try {
    return summarizeNumStat(git(["diff", "--numstat", range]));
  } catch {
    return { files: 0, insertions: 0, deletions: 0 };
  }
}

function summarizeNumStat(output: string): DiffStats {
  if (!output.trim()) {
    return { files: 0, insertions: 0, deletions: 0 };
  }
  const rows = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let files = 0;
  let insertions = 0;
  let deletions = 0;
  for (const row of rows) {
    const [insert, deleteCount] = row.split(/\s+/);
    if (insert === "-" || deleteCount === "-") {
      continue;
    }
    files += 1;
    insertions += toNumber(insert);
    deletions += toNumber(deleteCount);
  }
  return { files, insertions, deletions };
}

function currentBranch() {
  const value = git(["branch", "--show-current"]);
  return value || "";
}

function analyzeFileImpact(filePath: string): FileImpact {
  const ext = filePath.includes(".") ? filePath.split(".").pop()?.toLowerCase() ?? "" : "";
  const focus: string[] = [];
  const evidencePoints: string[] = [];
  let risk: FileImpact["risk"] = "low";
  let category = "misc";
  let takeaway = "保持局部改动与回写一致，避免把小变更扩成新的重系统。";
  let layerHints: ValidationLayer["id"][] = ["static"];

  if (filePath.includes("tasks/queue/")) {
    category = "task-management";
    risk = "medium";
    focus.push("task 状态流转", "分支绑定", "更新痕迹完整性");
    evidencePoints.push("pnpm ai:validate-task-git", "pnpm validate:static");
    layerHints = ["static", "runtime"];
    takeaway = "任务状态、分支与发布版本必须同步回写，否则容易制造交付漂移。";
  } else if (filePath.includes("docs/prompts/") || filePath.includes("scripts/ai/")) {
    category = "ai-assets";
    risk = "medium";
    focus.push("prompt 真相源", "AI 路由契约", "输出结构");
    evidencePoints.push("pnpm validate:ai-output", "pnpm validate:static");
    layerHints = ["static", "ai-output"];
    takeaway = "prompt、路由和校验器要共用同一注册表，不要各自维护路径列表。";
  } else if (filePath.startsWith("docs/")) {
    category = "documentation";
    risk = "low";
    focus.push("文档一致性", "链接有效性", "来源边界");
    evidencePoints.push("文档渲染检查", "内部链接验证");
    layerHints = ["static"];
    takeaway = "文档优先服务导航和说明，不要在文档里重建业务状态。";
  } else if (filePath.startsWith("memory/experience/")) {
    category = "experience";
    risk = "low";
    focus.push("经验可比较性", "提炼是否过重", "复用边界");
    evidencePoints.push("经验索引检查", "人工 review");
    layerHints = ["static"];
    takeaway = "经验资产要短、稳、可比较，避免写成新的大段总结文档。";
  } else if (filePath.startsWith("memory/")) {
    category = "memory";
    risk = "low";
    focus.push("真相源边界", "current-state / roadmap 分工");
    evidencePoints.push("memory 交叉检查", "主源一致性检查");
    layerHints = ["static"];
    takeaway = "memory 只做沉淀与快照，不要重新承接执行细节。";
  } else if (filePath === "package.json" || filePath.endsWith("pnpm-lock.yaml")) {
    category = "dependencies";
    risk = "high";
    focus.push("脚本契约", "构建链", "依赖冲突");
    evidencePoints.push("pnpm install", "pnpm build", "pnpm test");
    layerHints = ["static", "build", "runtime"];
    takeaway = "依赖和脚本改动最容易牵出运行态，需要把构建和运行时一起看。";
  } else if (["ts", "tsx", "js", "jsx"].includes(ext)) {
    category = "source-code";
    risk = "high";
    focus.push("类型检查", "单元测试", "运行时行为");
    evidencePoints.push("pnpm lint", "pnpm test", "pnpm build");
    layerHints = ["static", "build", "runtime"];
    takeaway = "代码改动要按静态、构建、运行时三层去验证，不要只看单测。";
  } else if (ext === "py") {
    category = "python-code";
    risk = "medium";
    focus.push("语法检查", "导入测试", "运行时验证");
    evidencePoints.push(`python -m py_compile ${filePath}`);
    layerHints = ["static", "build"];
    takeaway = "Python 脚本要先保证语法和导入，再看是否影响主链。";
  } else if (["json", "yaml", "yml", "toml"].includes(ext)) {
    category = "config";
    risk = "high";
    focus.push("配置加载", "环境变量", "运行态一致性");
    evidencePoints.push("pnpm build", "pnpm preview:check", "pnpm prod:check");
    layerHints = ["static", "build", "runtime"];
    takeaway = "配置和环境变量改动看起来很小，实际最容易把运行态带偏。";
  } else {
    focus.push("局部检查", "运行态确认");
    evidencePoints.push("按变更类型补充验证");
  }

  return {
    file: filePath,
    risk,
    category,
    focus,
    evidencePoints,
    takeaway,
    layerHints,
  };
}

function buildCategories(impacts: FileImpact[]): DiffAwareCategory[] {
  const groups = new Map<string, DiffAwareCategory>();
  for (const impact of impacts) {
    const current = groups.get(impact.category) || {
      name: impact.category,
      files: [],
      risk: impact.risk,
      focus: [],
      takeaway: impact.takeaway,
    };
    current.files.push(impact.file);
    current.focus = dedupe([...current.focus, ...impact.focus]);
    current.risk = severityRank(current.risk) >= severityRank(impact.risk) ? current.risk : impact.risk;
    if (current.takeaway.length < impact.takeaway.length) {
      current.takeaway = impact.takeaway;
    }
    groups.set(impact.category, current);
  }

  return [...groups.values()].sort((left, right) => severityRank(right.risk) - severityRank(left.risk));
}

function selectSuggestedChecks(impacts: FileImpact[]): DiffAwareCheckLayer[] {
  const needed = new Set<ValidationLayer["id"]>();
  impacts.forEach((impact) => impact.layerHints.forEach((id) => needed.add(id)));
  if (needed.size === 0 && impacts.length > 0) {
    needed.add("static");
  }
  return VALIDATION_LAYERS.filter((layer) => needed.has(layer.id));
}

function calculateHealthScore(changedFiles: string[], impacts: FileImpact[], stats: DiffStats) {
  if (changedFiles.length === 0) {
    return { score: 100, grade: "A", reason: "无改动，无需新增 QA / Review / Retro 产物" };
  }

  let score = 100;
  const reasons: string[] = [];

  if (stats.files > 10) {
    score -= 20;
    reasons.push(`改动文件过多 (${stats.files})`);
  }

  if (stats.insertions + stats.deletions > 500) {
    score -= 15;
    reasons.push("改动行数较多");
  }

  const highRiskCount = impacts.filter((impact) => impact.risk === "high").length;
  const mediumRiskCount = impacts.filter((impact) => impact.risk === "medium").length;

  if (highRiskCount > 0) {
    score -= highRiskCount * 25;
    reasons.push(`存在 ${highRiskCount} 处高风险改动`);
  }
  if (mediumRiskCount > 0) {
    score -= mediumRiskCount * 10;
    reasons.push(`存在 ${mediumRiskCount} 处中等风险改动`);
  }

  const finalScore = Math.max(0, Math.min(100, score));
  const grade = finalScore >= 90 ? "A" : finalScore >= 80 ? "B" : finalScore >= 70 ? "C" : finalScore >= 60 ? "D" : "F";
  return {
    score: finalScore,
    grade,
    reason: reasons.length > 0 ? reasons.join("；") : "改动风险可控",
  };
}

function buildScopeSummary(changedFiles: string[], categories: DiffAwareCategory[], stats: DiffStats) {
  if (changedFiles.length === 0) {
    return "当前工作区没有新的 diff，暂不需要生成新的 QA / Review / Retro 产物。";
  }

  const categoryNames = categories.map((item) => categoryLabel(item.name)).join("、");
  return `本次改动涉及 ${stats.files || changedFiles.length} 个文件，主要集中在 ${categoryNames || "通用代码"}。`;
}

function buildReviewSummary(
  scopeSummary: string,
  healthScore: { score: number; grade: string; reason: string },
  suggestedChecks: DiffAwareCheckLayer[],
  categories: DiffAwareCategory[],
) {
  if (scopeSummary.includes("没有新的 diff")) {
    return "当前没有新的改动，review 只需确认上一轮 release 仍保持稳定。";
  }

  const checkNames = suggestedChecks.map((layer) => layer.title).join(" → ");
  const topCategory = categories[0];
  const topTakeaway = topCategory ? topCategory.takeaway : "先按最小检查链确认变更边界。";
  return `建议先按 ${checkNames || "静态门禁"} 验证，再确认 ${topTakeaway} 当前健康评分 ${healthScore.score}/100 (${healthScore.grade})，${healthScore.reason}。`;
}

function buildRetroSummary(categories: DiffAwareCategory[], healthScore: { score: number; grade: string; reason: string }) {
  if (categories.length === 0) {
    return "暂无新增 retro；可继续沿用上一轮已验证的发布经验。";
  }

  const topCategory = categories[0];
  return `这轮最值得复用的经验是：${topCategory.takeaway} 当前健康评分 ${healthScore.score}/100 (${healthScore.grade})，便于横向比较后续类似改动。`;
}

function buildShipLog(
  scopeSummary: string,
  suggestedChecks: DiffAwareCheckLayer[],
  reviewSummary: string,
  retroSummary: string,
  healthScore: { score: number; grade: string; reason: string },
) {
  return [
    `范围：${scopeSummary}`,
    `检查：${suggestedChecks.length > 0 ? suggestedChecks.map((layer) => layer.title).join(" / ") : "无新增检查"}`,
    `review：${reviewSummary}`,
    `retro：${retroSummary}`,
    `结论：${healthScore.score}/100 (${healthScore.grade})，${healthScore.reason}`,
  ];
}

function buildNextActions(healthScore: { score: number; grade: string; reason: string }, suggestedChecks: DiffAwareCheckLayer[], changedCount: number) {
  const actions: string[] = [];
  if (changedCount === 0) {
    actions.push("继续正常开发流程");
    return actions;
  }

  if (suggestedChecks.length > 0) {
    actions.push(`优先执行 ${suggestedChecks.map((layer) => layer.id).join(" → ")} 层检查`);
  }
  if (healthScore.score < 70) {
    actions.push("建议补做更全面的人工 review");
  }
  if (healthScore.score < 50) {
    actions.push("强烈建议暂停发布，先收敛高风险改动");
  }
  actions.push("收集 review / retro 结果，沉淀到 experience 或 release 摘要");
  return dedupe(actions);
}

function git(args: string[]) {
  try {
    return execFileSync("git", args, { cwd: getWorkspaceRoot(), encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function dedupe(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function toNumber(value: string | undefined) {
  const parsed = Number.parseInt(value || "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function severityRank(value: "low" | "medium" | "high") {
  return value === "high" ? 3 : value === "medium" ? 2 : 1;
}

function categoryLabel(value: string) {
  const labels: Record<string, string> = {
    "task-management": "任务管理",
    "ai-assets": "AI 资产",
    documentation: "文档",
    experience: "经验",
    memory: "记忆",
    dependencies: "依赖",
    "source-code": "源码",
    "python-code": "Python",
    config: "配置",
    misc: "通用改动",
  };
  return labels[value] || value;
}
