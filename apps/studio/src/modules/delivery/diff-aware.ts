import {
  analyzeFileImpact,
  buildCategories,
  buildNextActions,
  buildReviewSummary,
  buildRetroSummary,
  buildScopeSummary,
  buildShipLog,
  calculateHealthScore,
  collectEvidencePoints,
  selectSuggestedChecks,
} from "./diff-aware-analysis";
import { buildRetirementSuggestions, buildSelectedChecks } from "./diff-aware-summaries";
import { readDiffSnapshot, type DiffStats } from "./diff-aware-source";
import type { DiffAwareArtifact } from "./types";

export function collectDiffAwareArtifact(): DiffAwareArtifact {
  const { changedFiles, stats } = readDiffSnapshot();
  return buildDiffAwareArtifactFromFiles(changedFiles, stats);
}

export function buildDiffAwareArtifactFromFiles(changedFiles: string[], stats: DiffStats): DiffAwareArtifact {
  const impacts = changedFiles.map((file) => analyzeFileImpact(file));
  const categories = buildCategories(impacts);
  const healthScore = calculateHealthScore(changedFiles, impacts, stats);
  const suggestedChecks = selectSuggestedChecks(impacts);
  const selectedChecks = buildSelectedChecks(suggestedChecks, categories, healthScore);
  const scopeSummary = buildScopeSummary(changedFiles, categories, stats);
  const reviewSummary = buildReviewSummary(scopeSummary, healthScore, suggestedChecks, categories);
  const retroSummary = buildRetroSummary(categories, healthScore);
  const shipLog = buildShipLog(scopeSummary, suggestedChecks, reviewSummary, retroSummary, healthScore);
  const evidencePoints = collectEvidencePoints(impacts, suggestedChecks);
  const nextActions = buildNextActions(healthScore, suggestedChecks, changedFiles.length);
  const retirementSuggestions = buildRetirementSuggestions(categories, selectedChecks, healthScore);

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
    selectedChecks,
    retirementSuggestions,
    evidencePoints,
    nextActions,
    changedFiles,
    categories,
    healthScore,
    stats,
  };
}
