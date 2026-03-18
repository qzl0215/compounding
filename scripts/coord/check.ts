#!/usr/bin/env node
/**
 * Pre-task check: preflight + lock check + task companion creation.
 * Usage: node --experimental-strip-types scripts/coord/check.ts pre-task [--taskId=t-025]
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const { ensureCompanion } = require("./lib/task-meta.ts");

const ROOT = process.cwd();
const PREFLIGHT_OUTPUT = path.join(ROOT, "output", "agent_session", "latest_pre_mutation_check.json");
const LOCK_REGISTRY_PATH = path.join(ROOT, "agent-coordination", "locks", "lock-registry.json");

function parseArgs() {
  const cmd = process.argv[2];
  const args = {};
  for (let i = 3; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      args[key] = val !== undefined ? val : true;
    }
  }
  return { cmd, args };
}

function runPreflight() {
  try {
    const result = spawnSync("python3", ["scripts/pre_mutation_check.py"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.status !== 0) {
      return { ok: false, error: "Preflight failed", stderr: result.stderr, stdout: result.stdout };
    }
    let preflight = {};
    if (fs.existsSync(PREFLIGHT_OUTPUT)) {
      preflight = JSON.parse(fs.readFileSync(PREFLIGHT_OUTPUT, "utf8"));
    }
    return { ok: true, preflight };
  } catch (e) {
    return { ok: false, error: "Preflight error: " + (e.message || e) };
  }
}

function checkLocks(taskId, plannedFiles) {
  if (!fs.existsSync(LOCK_REGISTRY_PATH)) return { ok: true, conflicts: [] };
  const reg = JSON.parse(fs.readFileSync(LOCK_REGISTRY_PATH, "utf8"));
  const active = (reg.locks || []).filter((l) => l.status === "active");
  const conflicts = [];
  for (const lock of active) {
    if (lock.owner_task_id === taskId) continue;
    if (plannedFiles && plannedFiles.length && lock.target_type === "file") {
      if (plannedFiles.includes(lock.target)) {
        conflicts.push({ lock_id: lock.lock_id, target: lock.target, owner_task_id: lock.owner_task_id });
      }
    }
  }
  return { ok: conflicts.length === 0, conflicts };
}

function preTask(args) {
  const taskId = args.taskId;
  if (!taskId) {
    const out = { ok: false, error: "taskId is required. Use --taskId=t-025" };
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const preflight = runPreflight();
  if (!preflight.ok) {
    const out = { ok: false, step: "preflight", error: preflight.error, preflight };
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const compResult = ensureCompanion(taskId);
  if (!compResult.ok) {
    const out = { ok: false, step: "task_companion", error: compResult.error };
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const lockCheck = checkLocks(taskId, compResult.companion.planned_files);
  if (!lockCheck.ok) {
    const out = { ok: false, step: "lock_check", conflicts: lockCheck.conflicts };
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const output = {
    ok: true,
    task_id: taskId,
    preflight: preflight.preflight,
    companion: compResult.companion,
    lock_check: { ok: true },
  };
  console.log(JSON.stringify(output, null, 2));
}

const { cmd, args } = parseArgs();

if (cmd === "pre-task") preTask(args);
else {
  console.error(JSON.stringify({ ok: false, error: "Usage: check.ts pre-task --taskId=t-025" }));
  process.exit(1);
}
