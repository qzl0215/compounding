import type { DiffAwareCategory, DiffAwareCheckLayer, SelectedChecks } from "./types";
import type { DiffStats } from "./diff-aware-source";
import { categoryLabel, dedupe, type FileImpact } from "./diff-aware-impact";

export function calculateHealthScore(changedFiles: string[], impacts: FileImpact[], stats: DiffStats) {
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

export function buildScopeSummary(changedFiles: string[], categories: DiffAwareCategory[], stats: DiffStats) {
  if (changedFiles.length === 0) {
    return "当前工作区没有新的 diff，暂不需要生成新的 QA / Review / Retro 产物。";
  }

  const categoryNames = categories.map((item) => categoryLabel(item.name)).join("、");
  return `本次改动涉及 ${stats.files || changedFiles.length} 个文件，主要集中在 ${categoryNames || "通用代码"}。`;
}

export function buildReviewSummary(
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

export function buildRetroSummary(categories: DiffAwareCategory[], healthScore: { score: number; grade: string; reason: string }) {
  if (categories.length === 0) {
    return "暂无新增 retro；可继续沿用上一轮已验证的发布经验。";
  }

  const topCategory = categories[0];
  return `这轮最值得复用的经验是：${topCategory.takeaway} 当前健康评分 ${healthScore.score}/100 (${healthScore.grade})，便于横向比较后续类似改动。`;
}

export function buildShipLog(
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

export function buildNextActions(
  healthScore: { score: number; grade: string; reason: string },
  suggestedChecks: DiffAwareCheckLayer[],
  changedCount: number,
) {
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

export function buildSelectedChecks(
  suggestedChecks: DiffAwareCheckLayer[],
  categories: DiffAwareCategory[],
  healthScore: { score: number; grade: string; reason: string },
): SelectedChecks {
  const categoryNames = categories.map((item) => categoryLabel(item.name));
  const required = [];
  const recommended = [];

  for (const layer of suggestedChecks) {
    const selected = {
      ...layer,
      reason: buildCheckSelectionReason(layer.id, categoryNames, healthScore),
    };

    if (isRequiredCheck(layer.id, categories, healthScore.score)) {
      required.push(selected);
    } else {
      recommended.push(selected);
    }
  }

  return { required, recommended };
}

export function buildRetirementSuggestions(
  categories: DiffAwareCategory[],
  selectedChecks: SelectedChecks,
  healthScore: { score: number; grade: string; reason: string },
) {
  const categoryNames = categories.map((item) => item.name);
  const suggestions: string[] = [];

  if (categoryNames.some((name) => ["documentation", "memory", "experience"].includes(name))) {
    suggestions.push("若本次只改说明、经验或状态文本，优先保留链接/渲染/静态检查，退休重复的页面级回归。");
  }
  if (categoryNames.some((name) => ["ai-assets"].includes(name))) {
    suggestions.push("仅在 prompt / AI 脚本变化时保留 ai-output 门禁，其他改动不必重复跑这层。");
  }
  if (categoryNames.some((name) => ["source-code", "config", "dependencies"].includes(name))) {
    suggestions.push("若 build / runtime smoke 已稳定覆盖同类改动，可合并重复的细粒度测试，保留能抓独特错误的那一层。");
  }
  if (selectedChecks.required.length + selectedChecks.recommended.length === 0) {
    suggestions.push("当前没有新增检查，可沿用上一轮已验证的最小测试集。");
  }
  if (healthScore.score >= 90) {
    suggestions.push("高健康分改动不需要堆测试数量，优先保留最小可复用检查链。");
  }

  return dedupe(suggestions);
}

function isRequiredCheck(
  layerId: DiffAwareCheckLayer["id"],
  categories: DiffAwareCategory[],
  healthScore: number,
) {
  const categoryNames = categories.map((item) => item.name);
  if (layerId === "static" || layerId === "ai-output") {
    return true;
  }
  if (layerId === "build") {
    return categoryNames.some((name) => ["source-code", "dependencies", "config", "python-code"].includes(name));
  }
  if (layerId === "runtime") {
    return categoryNames.some((name) => ["source-code", "dependencies", "config", "task-management"].includes(name)) || healthScore < 80;
  }
  return false;
}

function buildCheckSelectionReason(
  layerId: DiffAwareCheckLayer["id"],
  categoryNames: string[],
  healthScore: { score: number; grade: string; reason: string },
) {
  const categoryList = categoryNames.join("、") || "通用改动";
  if (layerId === "static") {
    return `所有变更先过静态门禁，优先拦住 ${categoryList} 里的结构漂移。`;
  }
  if (layerId === "build") {
    return `构建门禁用来确认 ${categoryList} 没有引入类型、依赖或打包层回归。`;
  }
  if (layerId === "runtime") {
    return `运行时门禁用来确认 ${categoryList} 在真实预览/生产环境里仍然可用。`;
  }
  if (layerId === "ai-output") {
    return `AI 输出门禁只在 prompt / AI 脚本变化时跑，避免把输出验证扩成默认负担。`;
  }
  return `根据 ${categoryList} 与当前健康评分 ${healthScore.score}/100 (${healthScore.grade}) 选择这一层检查。`;
}
