import type { DiffAwareCategory, DiffAwareCheckLayer } from "./types";
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
