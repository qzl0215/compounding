#!/usr/bin/env node
/**
 * Project scanner: generates manifest.json and risk report from hard rules + heuristic rules.
 * Usage: node --experimental-strip-types scripts/coord/scan.ts [--report-only]
 */

const fs = require("node:fs");
const path = require("node:path");
const {
  saveManifest,
  loadOverrides,
  loadRiskRules,
  matchesHardRule,
  inferModule,
} = require("./lib/manifest.ts");
const { applyHeuristicRule, computeRiskLevel } = require("./lib/risk.ts");
const { getDerivedAssetObservationIgnoredPrefixes } = require("../../shared/derived-asset-contract.ts");

const ROOT = process.cwd();
const REPORT_ONLY = process.argv.includes("--report-only");

const IGNORE_DIRS = new Set([".git", "node_modules", "__pycache__", ".next", ...getDerivedAssetObservationIgnoredPrefixes(ROOT).map((prefix) => prefix.replace(/\/$/, ""))]);
const IGNORE_PREFIXES = getDerivedAssetObservationIgnoredPrefixes(ROOT);

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (IGNORE_PREFIXES.some((p) => rel.startsWith(p))) continue;
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(rel);
  }
  return files;
}

function toEntry(relPath, riskLevel, uiSurface) {
  const lockPolicy = riskLevel === "core" || riskLevel === "high_conflict" ? "hard" : "none";
  const executionMode =
    riskLevel === "core" ? "patch_only" : riskLevel === "high_conflict" ? "direct_edit" : "direct_edit";
  const requiredChecks = [];
  if (riskLevel === "core" || riskLevel === "high_conflict") requiredChecks.push("scope_reviewer");
  if (riskLevel === "core") requiredChecks.push("contract_reviewer");

  return {
    module: inferModule(relPath),
    risk_level: riskLevel,
    lock_policy: lockPolicy,
    execution_mode_hint: executionMode,
    required_checks: requiredChecks,
    ui_surface_flag: uiSurface,
  };
}

function main(): void {
  const riskRules = loadRiskRules();
  const overrides = loadOverrides();
  const allFiles = walk(ROOT);

  const files: Record<string, FileEntry> = {};
  const report: Record<string, { risk_level: RiskLevel; source: string }> = {};

  for (const relPath of allFiles) {
    if (relPath.startsWith("agent-coordination/")) continue;

    let riskLevel: RiskLevel = "normal";
    let uiSurface = false;
    let source = "heuristic";

    if (matchesHardRule(relPath, riskRules.hard_rules.patterns)) {
      riskLevel = "core";
      source = "hard_rule";
    } else {
      const results = [];
      for (const rule of riskRules.heuristic_rules.rules) {
        const r = applyHeuristicRule(relPath, rule);
        if (r.weight > 0) results.push(r);
      }
      const computed = computeRiskLevel(results);
      riskLevel = computed.riskLevel;
      uiSurface = computed.uiSurface;
    }

    const override = overrides.overrides[relPath];
    if (override) {
      if (override.risk_level) riskLevel = override.risk_level;
      source = "override";
    }

    const entry = toEntry(relPath, riskLevel, uiSurface);
    if (override) {
      if (override.lock_policy) entry.lock_policy = override.lock_policy;
      if (override.execution_mode_hint) entry.execution_mode_hint = override.execution_mode_hint;
      if (override.required_checks) entry.required_checks = override.required_checks;
      if (override.ui_surface_flag !== undefined) entry.ui_surface_flag = override.ui_surface_flag;
    }

    files[relPath] = entry;
    report[relPath] = { risk_level: riskLevel, source };
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    version: "1.0.0",
    files,
  };

  if (!REPORT_ONLY) {
    saveManifest(manifest);
  }

  const reportPath = path.join(ROOT, "agent-coordination", "reports", "risk-report.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const reportPayload = {
    generated_at: manifest.generated_at,
    report_only: REPORT_ONLY,
    total_files: Object.keys(files).length,
    by_risk: {
      core: Object.values(files).filter((e) => e.risk_level === "core").length,
      high_conflict: Object.values(files).filter((e) => e.risk_level === "high_conflict").length,
      normal: Object.values(files).filter((e) => e.risk_level === "normal").length,
      generated: Object.values(files).filter((e) => e.risk_level === "generated").length,
      test_only: Object.values(files).filter((e) => e.risk_level === "test_only").length,
      docs_only: Object.values(files).filter((e) => e.risk_level === "docs_only").length,
    },
    by_source: {
      hard_rule: Object.values(report).filter((r) => r.source === "hard_rule").length,
      heuristic: Object.values(report).filter((r) => r.source === "heuristic").length,
      override: Object.values(report).filter((r) => r.source === "override").length,
    },
    high_risk_files: Object.entries(files)
      .filter(([, e]) => e.risk_level === "core" || e.risk_level === "high_conflict")
      .map(([p, e]) => ({ path: p, risk_level: e.risk_level })),
    entries: report,
  };
  fs.writeFileSync(reportPath, JSON.stringify(reportPayload, null, 2) + "\n");

  const output = REPORT_ONLY ? reportPayload : { manifest_path: "agent-coordination/manifest/manifest.json", ...reportPayload };
  console.log(JSON.stringify(output, null, 2));
}

main();
