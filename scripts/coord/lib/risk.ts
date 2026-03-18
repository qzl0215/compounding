/**
 * Risk level computation for manifest scan
 */

function riskRank(level) {
  const ranks = { core: 6, high_conflict: 5, normal: 3, generated: 2, test_only: 1, docs_only: 1 };
  return ranks[level] ?? 0;
}

function computeRiskLevel(heuristicResults) {
  let riskLevel = "normal";
  let uiSurface = false;

  for (const r of heuristicResults) {
    if (r.riskLevel) {
      if (riskRank(r.riskLevel) > riskRank(riskLevel)) riskLevel = r.riskLevel;
    }
    if (r.riskBias && r.weight >= 1) {
      if (riskRank(r.riskBias) > riskRank(riskLevel)) riskLevel = r.riskBias;
    }
    if (r.uiSurface) uiSurface = true;
  }

  return { riskLevel, uiSurface };
}

function applyHeuristicRule(relPath, rule) {
  const re = new RegExp(rule.pattern);
  if (!re.test(relPath)) return { weight: 0, uiSurface: false };

  if (rule.exclude) {
    for (const ex of rule.exclude) {
      const exRe = new RegExp(ex.replace(/\*/g, ".*"));
      if (exRe.test(relPath)) return { weight: 0, uiSurface: false };
    }
  }

  const weight = rule.weight ?? 1;
  return {
    riskLevel: rule.risk_level,
    weight,
    riskBias: rule.risk_bias,
    uiSurface: rule.ui_surface_flag ?? false,
  };
}

module.exports = { computeRiskLevel, applyHeuristicRule };
