#!/usr/bin/env node
/**
 * Auto-review orchestrator: scope + lock + contract + architecture + test reviewers, merge gate.
 * Usage: node --experimental-strip-types scripts/coord/review.ts [--taskId=t-025]
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { loadManifest } = require("./lib/manifest.ts");

const ROOT = process.cwd();
const LOCK_REGISTRY_PATH = path.join(ROOT, "agent-coordination", "locks", "lock-registry.json");
const MERGE_POLICY_PATH = path.join(ROOT, "agent-coordination", "policies", "merge-policy.json");

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

function runScopeReviewer(taskId) {
  const result = spawnSync(
    "node",
    ["--experimental-strip-types", "scripts/coord/scope-guard.ts", taskId ? `--taskId=${taskId}` : ""].filter(Boolean),
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  try {
    const out = JSON.parse(result.stdout || "{}");
    return {
      name: "scope_reviewer",
      pass: out.pass !== false,
      scope_risk_score: out.scope_risk_score ?? 0,
      scope_summary: out.scope_summary ?? "",
      raw: out,
    };
  } catch {
    return { name: "scope_reviewer", pass: false, scope_risk_score: 100, scope_summary: "Scope check failed to run.", raw: {} };
  }
}

function runLockReviewer(taskId, changedFiles) {
  if (!fs.existsSync(LOCK_REGISTRY_PATH)) {
    return { name: "lock_reviewer", pass: true, lock_violation_detail: null };
  }
  const reg = JSON.parse(fs.readFileSync(LOCK_REGISTRY_PATH, "utf8"));
  const active = (reg.locks || []).filter((l) => l.status === "active");
  const violations = [];
  for (const lock of active) {
    if (lock.owner_task_id === taskId) continue;
    if (changedFiles && changedFiles.includes(lock.target)) {
      violations.push({ target: lock.target, owner_task_id: lock.owner_task_id, owner_agent: lock.owner_agent });
    }
  }
  return {
    name: "lock_reviewer",
    pass: violations.length === 0,
    lock_violation_detail: violations.length ? violations : null,
  };
}

function runContractReviewer(changedFiles) {
  const filesArg = changedFiles.length ? `--changedFiles=${changedFiles.join("|")}` : "";
  const result = spawnSync(
    "node",
    ["--experimental-strip-types", "scripts/coord/contract-reviewer.ts", filesArg].filter(Boolean),
    { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  try {
    const out = JSON.parse(result.stdout || "{}");
    return { name: "contract_reviewer", pass: out.pass !== false, summary: out.summary ?? "", raw: out };
  } catch {
    return { name: "contract_reviewer", pass: false, summary: "Contract check failed to run.", raw: {} };
  }
}

function runArchitectureReviewer(changedFiles, scopeRiskScore) {
  const args = ["--experimental-strip-types", "scripts/coord/architecture-reviewer.ts"];
  if (changedFiles.length) args.push(`--changedFiles=${changedFiles.join("|")}`);
  if (scopeRiskScore != null) args.push(`--scopeRiskScore=${scopeRiskScore}`);
  const result = spawnSync("node", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  try {
    const out = JSON.parse(result.stdout || "{}");
    return {
      name: "architecture_reviewer",
      pass: out.pass !== false,
      arch_risk_score: out.arch_risk_score ?? 0,
      summary: out.summary ?? "",
      raw: out,
    };
  } catch {
    return {
      name: "architecture_reviewer",
      pass: false,
      arch_risk_score: 100,
      summary: "Architecture check failed to run.",
      raw: {},
    };
  }
}

function runTestReviewer() {
  const result = spawnSync("pnpm", ["validate:static"], { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const pass = result.status === 0;
  return {
    name: "test_reviewer",
    pass,
    test_status: pass ? "passed" : "failed",
    stderr: result.stderr ? result.stderr.slice(0, 500) : null,
  };
}

function loadMergePolicy() {
  if (!fs.existsSync(MERGE_POLICY_PATH)) return null;
  return JSON.parse(fs.readFileSync(MERGE_POLICY_PATH, "utf8"));
}

function computeMergeDecision(reviewers, changedFiles, manifest) {
  const allPass = reviewers.every((r) => r.pass);
  const scopeResult = reviewers.find((r) => r.name === "scope_reviewer");
  const archResult = reviewers.find((r) => r.name === "architecture_reviewer");
  const scopeRisk = scopeResult?.scope_risk_score ?? 0;
  const archRisk = archResult?.arch_risk_score ?? 0;
  const confidence = allPass ? Math.max(0.7, 0.9 - (scopeRisk + archRisk) / 200) : 0.3;

  let hasHighRisk = false;
  for (const f of changedFiles || []) {
    const entry = manifest?.files?.[f];
    if (entry && (entry.risk_level === "core" || entry.risk_level === "high_conflict")) {
      hasHighRisk = true;
      break;
    }
  }

  const policy = loadMergePolicy();
  const highThreshold = policy?.thresholds?.high_risk?.auto_merge_confidence ?? 1.0;
  const defaultEscalate = policy?.thresholds?.high_risk?.default_action === "escalate_to_human";

  if (!allPass) {
    return {
      merge_decision: "block_and_retry",
      merge_confidence_score: 0.3,
      merge_decision_explanation: reviewers
        .filter((r) => !r.pass)
        .map((r) => `${r.name} failed`)
        .join(". "),
    };
  }

  if (hasHighRisk && defaultEscalate && confidence < highThreshold) {
    return {
      merge_decision: "escalate_to_human",
      merge_confidence_score: confidence,
      merge_decision_explanation: "High-risk files modified; human review recommended.",
    };
  }

  return {
    merge_decision: "auto_merge",
    merge_confidence_score: confidence,
    merge_decision_explanation: "All reviewers passed.",
  };
}

function main() {
  const args = parseArgs();
  const taskId = args.taskId;

  const scopeResult = runScopeReviewer(taskId);
  const changedFiles = scopeResult.raw?.actual_files || [];
  const lockResult = runLockReviewer(taskId, changedFiles);
  const contractResult = runContractReviewer(changedFiles);
  const archResult = runArchitectureReviewer(changedFiles, scopeResult.scope_risk_score);
  const testResult = runTestReviewer();

  const reviewers = [scopeResult, lockResult, contractResult, archResult, testResult];
  const allPass = reviewers.every((r) => r.pass);

  let manifest = { files: {} };
  try {
    manifest = loadManifest();
  } catch (_) {}

  const mergeOut = computeMergeDecision(reviewers, changedFiles, manifest);

  const output = {
    ok: allPass,
    generated_at: new Date().toISOString(),
    task_id: taskId || null,
    reviewers,
    ...mergeOut,
  };

  console.log(JSON.stringify(output, null, 2));
  if (!allPass) process.exit(1);
  if (mergeOut.merge_decision === "escalate_to_human") process.exit(2);
}

main();
