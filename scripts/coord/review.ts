#!/usr/bin/env node
/**
 * Auto-review orchestrator: scope + lock + test reviewers, JSON output.
 * Usage: node --experimental-strip-types scripts/coord/review.ts [--taskId=t-025]
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { readCompanion } = require("./lib/task-meta.ts");
const { loadManifest } = require("./lib/manifest.ts");

const ROOT = process.cwd();
const LOCK_REGISTRY_PATH = path.join(ROOT, "agent-coordination", "locks", "lock-registry.json");

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

function main() {
  const args = parseArgs();
  const taskId = args.taskId;

  const scopeResult = runScopeReviewer(taskId);
  const changedFiles = scopeResult.raw?.actual_files || [];
  const lockResult = runLockReviewer(taskId, changedFiles);
  const testResult = runTestReviewer();

  const allPass = scopeResult.pass && lockResult.pass && testResult.pass;

  const output = {
    ok: allPass,
    generated_at: new Date().toISOString(),
    task_id: taskId || null,
    reviewers: [scopeResult, lockResult, testResult],
    merge_decision: allPass ? "auto_merge" : "block_and_retry",
    merge_confidence_score: allPass ? 0.9 : 0.3,
    merge_decision_explanation: allPass
      ? "All reviewers passed."
      : [scopeResult.pass ? null : "Scope reviewer failed.", lockResult.pass ? null : "Lock reviewer failed.", testResult.pass ? null : "Test reviewer failed."]
          .filter(Boolean)
          .join(" "),
  };

  console.log(JSON.stringify(output, null, 2));
  if (!allPass) process.exit(1);
}

main();
