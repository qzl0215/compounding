const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = process.cwd();
const PREFLIGHT_OUTPUT = path.join(ROOT, "output", "agent_session", "latest_pre_mutation_check.json");
const LOCK_REGISTRY_PATH = path.join(ROOT, "agent-coordination", "locks", "lock-registry.json");
const RUNTIME_PROFILES = [
  { profile: "prod", script: "scripts/local-runtime/status-prod.ts", label: "本地生产" },
  { profile: "dev", script: "scripts/local-runtime/status-preview.ts", label: "dev 预览" },
];

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

function runJsonNodeScript(scriptPath, extraArgs = []) {
  const result = spawnSync("node", ["--experimental-strip-types", scriptPath, ...extraArgs], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = String(result.stdout || "").trim();
  let parsed = null;
  if (stdout) {
    try {
      parsed = JSON.parse(stdout);
    } catch (_) {
      parsed = null;
    }
  }
  return {
    ok: result.status === 0,
    status: result.status,
    stdout,
    stderr: String(result.stderr || "").trim(),
    parsed,
  };
}

function isPlanned(plannedFiles, target) {
  if (!plannedFiles || !plannedFiles.length) return false;
  if (plannedFiles.includes(target)) return true;
  return plannedFiles.some((p) => p.endsWith("/") && target.startsWith(p));
}

function checkLocks(taskId, plannedFiles) {
  if (!fs.existsSync(LOCK_REGISTRY_PATH)) return { ok: true, conflicts: [], suggested_execution_mode: null };
  const reg = JSON.parse(fs.readFileSync(LOCK_REGISTRY_PATH, "utf8"));
  const active = (reg.locks || []).filter((l) => l.status === "active");
  const conflicts = [];
  for (const lock of active) {
    if (lock.owner_task_id === taskId) continue;
    if (plannedFiles && plannedFiles.length && lock.target_type === "file") {
      if (isPlanned(plannedFiles, lock.target)) {
        conflicts.push({ lock_id: lock.lock_id, target: lock.target, owner_task_id: lock.owner_task_id });
      }
    }
  }
  return {
    ok: conflicts.length === 0,
    conflicts,
    suggested_execution_mode: conflicts.length > 0 ? "patch_only" : null,
  };
}

function summarizePreflight(preflight) {
  const blockers = [];
  const notes = [];
  const payload = preflight?.preflight || preflight || {};
  if (payload.worktree_clean === false) {
    blockers.push({
      step: "preflight",
      issue: "工作区未清理",
      details: payload,
    });
  }
  if (payload.has_remote && payload.sync_status && !["clean", "no_remote"].includes(payload.sync_status)) {
    blockers.push({
      step: "preflight",
      issue: "分支不同步",
      details: payload,
    });
  }
  if (payload.has_remote === false || payload.sync_status === "no_remote") {
    notes.push({
      step: "preflight",
      issue: "无远端或未校验同步状态",
      details: payload,
    });
  }
  return {
    ok: blockers.length === 0,
    payload,
    blockers,
    notes,
  };
}

function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase();
}

function collectRuntimeStatuses() {
  const statuses = [];
  const blockers = [];
  const notes = [];
  for (const item of RUNTIME_PROFILES) {
    const result = runJsonNodeScript(item.script);
    if (!result.parsed) {
      blockers.push({
        profile: item.profile,
        label: item.label,
        status: "unparseable",
        reason: `无法解析 ${item.label} 状态输出。`,
      });
      statuses.push({
        profile: item.profile,
        label: item.label,
        status: "unparseable",
        running: false,
        ok: false,
        reason: "无法解析状态输出。",
      });
      continue;
    }

    const payload = result.parsed;
    const status = normalizeStatus(payload.status);
    const runtimeStatus = {
      profile: item.profile,
      label: item.label,
      ok: Boolean(payload.ok),
      status,
      running: Boolean(payload.running),
      port: payload.port ?? null,
      pid: payload.pid ?? null,
      runtime_release_id: payload.runtime_release_id ?? null,
      current_release_id: payload.current_release_id ?? null,
      drift: Boolean(payload.drift),
      reason: payload.reason || "",
      log_path: payload.log_path || null,
      state_path: payload.state_path || null,
    };
    statuses.push(runtimeStatus);

    if (["unmanaged", "stale_pid", "port_error", "drift"].includes(status)) {
      blockers.push(runtimeStatus);
    } else if (status === "stopped") {
      notes.push(runtimeStatus);
    }
  }

  return {
    ok: blockers.length === 0,
    statuses,
    blockers,
    notes,
  };
}

function runScopeGuard(taskId) {
  const result = runJsonNodeScript("scripts/coord/scope-guard.ts", taskId ? [`--taskId=${taskId}`] : []);
  const payload = result.parsed || {
    ok: false,
    pass: false,
    scope_risk_score: 100,
    scope_summary: "Scope guard failed to run.",
    planned_files: [],
    actual_files: [],
    undeclared: [],
    high_risk_undeclared: [],
    declared_but_unchanged: [],
  };
  return {
    ok: Boolean(payload.pass),
    ...payload,
  };
}

module.exports = {
  checkLocks,
  collectRuntimeStatuses,
  runJsonNodeScript,
  runPreflight,
  runScopeGuard,
  summarizePreflight,
};
