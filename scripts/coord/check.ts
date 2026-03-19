#!/usr/bin/env node
/**
 * Pre-task check: preflight + runtime + scope + lock + task companion creation.
 * Usage: node --experimental-strip-types scripts/coord/check.ts pre-task [--taskId=t-025]
 */

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const { ensureCompanion } = require("./lib/task-meta.ts");

const ROOT = process.cwd();
const PREFLIGHT_OUTPUT = path.join(ROOT, "output", "agent_session", "latest_pre_mutation_check.json");
const LOCK_REGISTRY_PATH = path.join(ROOT, "agent-coordination", "locks", "lock-registry.json");
const RUNTIME_PROFILES = [
  { profile: "prod", script: "scripts/local-runtime/status-prod.ts", label: "本地生产" },
  { profile: "dev", script: "scripts/local-runtime/status-preview.ts", label: "dev 预览" },
];

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

function buildDecisionOptions({ preflightCheck, runtimeCheck, scopeCheck, lockCheck }) {
  const runtimeIssueCount = runtimeCheck.blockers.length;
  const scopeIssueCount = (scopeCheck.high_risk_undeclared || []).length;
  const lockIssueCount = (lockCheck.conflicts || []).length;
  const preflightIssueCount = preflightCheck.blockers.length;
  return [
    {
      option_id: "A",
      title: "先修复后重试",
      summary: "先整理工作区、处理运行态、锁冲突和 scope 风险，再重新执行 pre-task。",
      user_visible_impact: "当前任务暂不进入执行，保留原边界。",
      benefits: ["避免越界扩散", "减少半途返工"],
      risks: ["需要先处理阻塞项"],
      scope: "runtime / scope / lock blockers",
      rollback_cost: "low",
      confidence: Math.max(0.7, 1 - (runtimeIssueCount + scopeIssueCount + lockIssueCount + preflightIssueCount) * 0.1),
      recommended: true,
    },
    {
      option_id: "B",
      title: "缩小范围再试",
      summary: "先收缩 planned_files 或调整任务边界，再重新进入 pre-task。",
      user_visible_impact: "任务仍可继续，但需要先明确更小的 scope。",
      benefits: ["可快速收口", "降低协调成本"],
      risks: ["可能延后交付"],
      scope: "task scope",
      rollback_cost: "none",
      confidence: 0.85,
      recommended: scopeIssueCount > 0 && runtimeIssueCount === 0 && lockIssueCount === 0,
    },
    {
      option_id: "C",
      title: "人工裁决",
      summary: "由人先确认是否需要调整模式、锁状态或当前运行态。",
      user_visible_impact: "暂停自动推进，等待人工确认。",
      benefits: ["最安全", "避免误判"],
      risks: ["流转变慢"],
      scope: "human review",
      rollback_cost: "none",
      confidence: 1,
      recommended: false,
    },
  ];
}

function createDecisionCard(taskId, preflightCheck, runtimeCheck, scopeCheck, lockCheck) {
  const summaryParts = [];
  if (preflightCheck.blockers.length > 0) {
    summaryParts.push(
      `preflight blockers: ${preflightCheck.blockers.map((item) => item.issue).join(", ")}`
    );
  }
  if (runtimeCheck.blockers.length > 0) {
    summaryParts.push(
      `runtime blockers: ${runtimeCheck.blockers
        .map((item) => `${item.label}:${item.status}`)
        .join(", ")}`
    );
  }
  if ((scopeCheck.high_risk_undeclared || []).length > 0) {
    summaryParts.push(`high risk scope: ${scopeCheck.high_risk_undeclared.join(", ")}`);
  }
  if ((lockCheck.conflicts || []).length > 0) {
    summaryParts.push(
      `lock conflicts: ${lockCheck.conflicts.map((item) => `${item.target} <- ${item.owner_task_id}`).join(", ")}`
    );
  }

  if (summaryParts.length === 0) {
    return { ok: true, decision: null };
  }

  const options = buildDecisionOptions({ preflightCheck, runtimeCheck, scopeCheck, lockCheck });
  const result = runJsonNodeScript("scripts/coord/decision.ts", [
    "--type=pre_task_guard",
    `--taskId=${taskId}`,
    `--options=${JSON.stringify(options)}`,
    `--diff_summary=${summaryParts.join("; ")}`,
    "--key_pages=/tasks,/releases",
  ]);

  return result.parsed || { ok: false, error: "Failed to create decision card.", raw: { stdout: result.stdout, stderr: result.stderr } };
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

  const preflightCheck = summarizePreflight(preflight);
  const runtimeCheck = collectRuntimeStatuses();
  const scopeCheck = runScopeGuard(taskId);
  const lockCheck = checkLocks(taskId, compResult.companion.planned_files);
  const blockers = [];
  if (!preflightCheck.ok) {
    blockers.push(...preflightCheck.blockers);
  }
  if (!runtimeCheck.ok) {
    blockers.push({
      step: "runtime_check",
      issue: "运行态异常",
      details: runtimeCheck.blockers,
    });
  }
  if (!scopeCheck.ok) {
    blockers.push({
      step: "scope_guard",
      issue: "范围越界",
      details: scopeCheck.high_risk_undeclared,
    });
  }
  if (!lockCheck.ok) {
    blockers.push({
      step: "lock_check",
      issue: "锁冲突",
      details: lockCheck.conflicts,
    });
  }

  if (blockers.length > 0) {
    const decisionCard = createDecisionCard(taskId, preflightCheck, runtimeCheck, scopeCheck, lockCheck);
    const out = {
      ok: false,
      step: "pre_task_guard",
      blockers,
      preflight_check: preflightCheck,
      runtime_check: runtimeCheck,
      scope_check: scopeCheck,
      lock_check: {
        ok: lockCheck.ok,
        conflicts: lockCheck.conflicts,
        suggested_execution_mode: lockCheck.suggested_execution_mode,
      },
      decision_card: decisionCard,
      reason: "pre-task gate detected runtime, scope, or lock blockers. See decision_card for human choice.",
    };
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const output = {
    ok: true,
    task_id: taskId,
    preflight: preflight.preflight,
    companion: compResult.companion,
    preflight_check: preflightCheck,
    runtime_check: runtimeCheck,
    scope_check: scopeCheck,
    lock_check: { ok: true, conflicts: [], suggested_execution_mode: null },
  };
  console.log(JSON.stringify(output, null, 2));
}

const { cmd, args } = parseArgs();

if (cmd === "pre-task") preTask(args);
else {
  console.error(JSON.stringify({ ok: false, error: "Usage: check.ts pre-task --taskId=t-025" }));
  process.exit(1);
}
