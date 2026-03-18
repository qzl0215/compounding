#!/usr/bin/env node
/**
 * Architecture reviewer: change surface, structure habits, simplification suggestions.
 * Outputs risk score and suggestions based on changed files and manifest.
 * Usage: node --experimental-strip-types scripts/coord/architecture-reviewer.ts [--changedFiles=file1|file2] [--scopeRiskScore=10]
 */

const fs = require("node:fs");
const path = require("node:path");
const { loadManifest } = require("./lib/manifest.ts");

const ROOT = process.cwd();
const MAX_FILES_SUGGEST = 15;

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      args[key] = val !== undefined ? val : true;
    }
  }
  return args;
}

function main() {
  const args = parseArgs();
  const changedFilesRaw = args.changedFiles || "";
  const changedFiles = changedFilesRaw ? changedFilesRaw.split("|").map((f) => f.trim()).filter(Boolean) : [];
  const scopeRiskScore = Number(args.scopeRiskScore) || 0;

  let manifest = { files: {} };
  try {
    manifest = loadManifest();
  } catch (_) {}

  let maxRiskRank = 0;
  const riskRanks = { core: 3, high_conflict: 2, normal: 1, generated: 0, test_only: 0, docs_only: 0 };
  let highRiskCount = 0;
  const modules = new Set();

  for (const f of changedFiles) {
    const entry = manifest.files[f];
    const rank = entry ? (riskRanks[entry.risk_level] ?? 1) : 1;
    if (rank > maxRiskRank) maxRiskRank = rank;
    if (entry && (entry.risk_level === "core" || entry.risk_level === "high_conflict")) highRiskCount++;
    if (entry) modules.add(entry.module);
  }

  const archRiskScore = Math.min(100, scopeRiskScore + highRiskCount * 15 + (modules.size > 3 ? 10 : 0));
  const pass = archRiskScore < 95;
  const suggestions = [];

  if (changedFiles.length > MAX_FILES_SUGGEST) {
    suggestions.push(`Consider splitting: ${changedFiles.length} files changed (suggest < ${MAX_FILES_SUGGEST}).`);
  }
  if (modules.size > 3) {
    suggestions.push(`Cross-module change: ${modules.size} modules touched.`);
  }
  if (highRiskCount > 0) {
    suggestions.push(`${highRiskCount} core/high_conflict file(s) modified.`);
  }

  const output = {
    name: "architecture_reviewer",
    pass,
    arch_risk_score: archRiskScore,
    summary: pass ? "Architecture check passed." : "Architecture risk elevated.",
    suggestions: suggestions.length ? suggestions : null,
    raw: {
      changed_file_count: changedFiles.length,
      module_count: modules.size,
      high_risk_count: highRiskCount,
      scope_risk_score: scopeRiskScore,
    },
  };

  console.log(JSON.stringify(output, null, 2));
  if (!pass) process.exit(1);
}

main();
