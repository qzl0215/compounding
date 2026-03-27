#!/usr/bin/env node
/**
 * Scope guard: compare planned_files vs actual git diff.
 * Usage: node --experimental-strip-types scripts/coord/scope-guard.ts [--taskId=t-025]
 */

const { ensureCompanion } = require("./lib/task-meta.ts");
const { loadManifest } = require("./lib/manifest.ts");
const { attachChangePacketAliases, buildChangePacket } = require("../ai/lib/change-policy.ts");

const ROOT = process.cwd();

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
  const taskId = args.taskId;
  const changePacket = buildChangePacket(ROOT, { mode: "worktree" });

  let plannedFiles = [];
  if (taskId) {
    const compResult = ensureCompanion(taskId);
    if (compResult.ok && compResult.companion.planned_files) plannedFiles = compResult.companion.planned_files;
  }

  const actualFiles = changePacket.changed_files;
  if (actualFiles.length === 0) {
    const out = attachChangePacketAliases({
      ok: true,
      pass: true,
      scope_risk_score: 0,
      scope_summary: "No repo-tracked changes to validate.",
      planned_files: plannedFiles,
      actual_files: [],
      undeclared: [],
      declared_but_unchanged: plannedFiles.filter((p) => !actualFiles.includes(p)),
    }, changePacket);
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  let manifest = { files: {} };
  try {
    manifest = loadManifest();
  } catch (_) {}

  function isDeclared(filePath) {
    if (plannedFiles.includes(filePath)) return true;
    return plannedFiles.some((p) => p.endsWith("/") && filePath.startsWith(p));
  }
  const undeclared = actualFiles.filter((f) => !isDeclared(f));
  const highRiskUndeclared = undeclared.filter((f) => {
    const entry = manifest.files[f];
    return entry && (entry.risk_level === "core" || entry.risk_level === "high_conflict");
  });

  const declaredButUnchanged = plannedFiles.filter((p) => !actualFiles.includes(p));

  let pass = true;
  let scope_risk_score = 0;
  let scope_summary = "";

  if (highRiskUndeclared.length > 0) {
    pass = false;
    scope_risk_score = 100;
    scope_summary = `Block: ${highRiskUndeclared.length} core/high_conflict file(s) modified but not in planned_files.`;
  } else if (undeclared.length > 0) {
    pass = true;
    scope_risk_score = Math.min(50, undeclared.length * 10);
    scope_summary = `Warn: ${undeclared.length} file(s) modified but not in planned_files.`;
  } else {
    scope_summary = "Pass: All changed files are in planned_files.";
  }

  const output = attachChangePacketAliases({
    ok: pass,
    pass,
    scope_risk_score,
    scope_summary,
    planned_files: plannedFiles,
    actual_files: actualFiles,
    undeclared,
    high_risk_undeclared: highRiskUndeclared,
    declared_but_unchanged: declaredButUnchanged,
  }, changePacket);

  console.log(JSON.stringify(output, null, 2));
  if (!pass) process.exit(1);
}

main();
