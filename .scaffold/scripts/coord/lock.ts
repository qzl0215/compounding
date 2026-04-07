#!/usr/bin/env node
/**
 * Lock registry: acquire / release / status for file/module locks.
 * Usage: node --experimental-strip-types scripts/coord/lock.ts <acquire|release|status> [options]
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const LOCK_REGISTRY_PATH = path.join(ROOT, "agent-coordination", "locks", "lock-registry.json");
const LOCK_FILE_PATH = path.join(ROOT, "agent-coordination", "locks", ".lock-registry.lock");

function ensureDir() {
  const dir = path.dirname(LOCK_REGISTRY_PATH);
  fs.mkdirSync(dir, { recursive: true });
}

function readRegistry() {
  ensureDir();
  if (!fs.existsSync(LOCK_REGISTRY_PATH)) {
    return { version: "1.0.0", updated_at: null, locks: [] };
  }
  const raw = fs.readFileSync(LOCK_REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

function writeRegistry(registry) {
  registry.updated_at = new Date().toISOString();
  fs.writeFileSync(LOCK_REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");
}

function withLock(callback) {
  ensureDir();
  let fd;
  try {
    fd = fs.openSync(LOCK_FILE_PATH, "wx");
  } catch (e) {
    if (e.code === "EEXIST") {
      throw new Error("Lock registry is busy. Retry shortly.");
    }
    throw e;
  }
  try {
    return callback();
  } finally {
    fs.closeSync(fd);
    fs.rmSync(LOCK_FILE_PATH, { force: true });
  }
}

function generateLockId() {
  return "lock-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
}

function acquire(args) {
  const targetType = args.targetType || "file";
  const target = args.target;
  const taskId = args.taskId;
  const agent = args.agent || "default";
  const policy = args.policy || "soft";
  const releaseCondition = args.releaseCondition || "merged_to_dev";

  if (!target || !taskId) {
    console.error(JSON.stringify({ ok: false, error: "target and taskId are required" }));
    process.exit(1);
  }

  const result = withLock(() => {
    const reg = readRegistry();
    const conflict = reg.locks.find(
      (l) => l.status === "active" && l.target === target && l.target_type === targetType
    );
    if (conflict) {
      return {
        ok: false,
        error: "Target already locked",
        conflict: { owner_task_id: conflict.owner_task_id, owner_agent: conflict.owner_agent },
        suggested_execution_mode: "patch_only",
        reason: "locked core/high_conflict 且非主写手，按 execution-modes 降级为 patch_only",
      };
    }

    const lock = {
      lock_id: generateLockId(),
      target_type: targetType,
      target,
      lock_policy: policy,
      owner_task_id: taskId,
      owner_agent: agent,
      acquired_at: new Date().toISOString(),
      release_condition: releaseCondition,
      status: "active",
    };
    reg.locks.push(lock);
    writeRegistry(reg);
    return { ok: true, lock };
  });

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

function release(args) {
  const lockId = args.lockId;
  const taskId = args.taskId;
  const target = args.target;

  if (!lockId && !taskId && !target) {
    console.error(JSON.stringify({ ok: false, error: "lockId, taskId, or target is required" }));
    process.exit(1);
  }

  const result = withLock(() => {
    const reg = readRegistry();
    const idx = reg.locks.findIndex(
      (l) =>
        l.status === "active" &&
        (l.lock_id === lockId || l.owner_task_id === taskId || (target && l.target === target))
    );
    if (idx < 0) {
      return { ok: false, error: "No matching active lock found" };
    }
    const released = reg.locks[idx];
    reg.locks[idx] = { ...released, status: "released", released_at: new Date().toISOString() };
    writeRegistry(reg);
    return { ok: true, released: released.lock_id };
  });

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

function status() {
  const reg = readRegistry();
  const active = reg.locks.filter((l) => l.status === "active");
  const output = {
    ok: true,
    total_locks: reg.locks.length,
    active_count: active.length,
    locks: active,
    updated_at: reg.updated_at,
  };
  console.log(JSON.stringify(output, null, 2));
}

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

const { cmd, args } = parseArgs();

if (cmd === "acquire") acquire(args);
else if (cmd === "release") release(args);
else if (cmd === "status") status();
else {
  console.error(JSON.stringify({ ok: false, error: "Usage: lock.ts acquire|release|status [--target=...] [--taskId=...] [--agent=...] [--lockId=...]" }));
  process.exit(1);
}
