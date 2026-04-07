const path = require("node:path");
const { buildLiveProjectJudgementContract } = require(path.join(process.cwd(), "shared", "project-judgement-live.ts"));
const { buildFeatureContextPacket } = require("./lib/feature-context.ts");

function validateJudgementContract() {
  const errors = [];
  const warnings = [];
  const checked_surfaces = ["home", "tasks", "releases"];
  const expected = buildLiveProjectJudgementContract(process.cwd());

  if (!expected.overallSummary || !expected.nextAction || !expected.currentPhase || !expected.currentMilestone) {
    errors.push("Shared project judgement contract is missing headline or next-step fields.");
  }

  for (const surface of checked_surfaces) {
    const packet = buildFeatureContextPacket(process.cwd(), { surface });
    if (!packet.project_judgement) {
      errors.push(`feature-context(${surface}) missing project_judgement.`);
      continue;
    }
    if (!packet.default_flow?.entry_command) {
      errors.push(`feature-context(${surface}) missing default_flow.entry_command.`);
    }
    if (packet.project_judgement.overallSummary !== expected.overallSummary) {
      errors.push(`feature-context(${surface}) overallSummary drifted from shared judgement contract.`);
    }
    if (packet.project_judgement.nextAction !== expected.nextAction) {
      errors.push(`feature-context(${surface}) nextAction drifted from shared judgement contract.`);
    }
    if (!packet.project_judgement.recommendedSurface?.href) {
      errors.push(`feature-context(${surface}) missing recommended surface.`);
    }
    if (packet.required_checks.length === 0) {
      warnings.push(`feature-context(${surface}) has no required checks.`);
    }
  }

  return {
    ok: errors.length === 0,
    layer: "judgement-contract",
    errors,
    warnings,
    details: {
      checked_surfaces,
      overall_summary: expected.overallSummary,
      next_action: expected.nextAction,
      recommended_surface: expected.recommendedSurface,
    },
  };
}

const payload = validateJudgementContract();
console.log(JSON.stringify(payload, null, 2));

if (!payload.ok) {
  process.exit(1);
}
