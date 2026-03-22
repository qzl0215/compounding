#!/usr/bin/env node
/**
 * Pre-task check: preflight + runtime + scope + lock + task companion creation.
 * Usage: node --experimental-strip-types scripts/coord/check.ts pre-task [--taskId=t-025]
 */

const { getChangePolicy } = require("../ai/lib/change-policy.ts");
const { ensureCompanion } = require("./lib/task-meta.ts");
const { recordPreTaskResult } = require("./lib/companion-lifecycle.ts");
const { createDecisionCard } = require("./lib/pre-task-decision.ts");
const {
  checkLocks,
  collectRuntimeStatuses,
  runPreflight,
  runScopeGuard,
  summarizePreflight,
} = require("./lib/pre-task-runtime.ts");

const ROOT = process.cwd();

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

function preTask(args) {
  const taskId = args.taskId;
  const changePolicy = getChangePolicy(ROOT);
  if (!changePolicy.policy.requires_pre_task) {
    const output = {
      ok: true,
      skipped: true,
      step: "pre_task_guard",
      reason: "light change policy does not require pre-task guard",
      task_id: taskId || null,
      change_class: changePolicy.change_class,
      policy: changePolicy.policy,
      changed_files: changePolicy.changed_files,
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  if (!taskId) {
    const out = {
      ok: false,
      error: "taskId is required. Use --taskId=t-025",
      change_class: changePolicy.change_class,
      policy: changePolicy.policy,
      changed_files: changePolicy.changed_files,
    };
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const preflight = runPreflight();
  if (!preflight.ok) {
    const out = {
      ok: false,
      step: "preflight",
      error: preflight.error,
      preflight,
      change_class: changePolicy.change_class,
      policy: changePolicy.policy,
      changed_files: changePolicy.changed_files,
    };
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const compResult = ensureCompanion(taskId);
  if (!compResult.ok) {
    const out = {
      ok: false,
      step: "task_companion",
      error: compResult.error,
      change_class: changePolicy.change_class,
      policy: changePolicy.policy,
      changed_files: changePolicy.changed_files,
    };
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
      change_class: changePolicy.change_class,
      policy: changePolicy.policy,
      changed_files: changePolicy.changed_files,
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
    recordPreTaskResult(taskId, out);
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const output = {
    ok: true,
    task_id: taskId,
    change_class: changePolicy.change_class,
    policy: changePolicy.policy,
    changed_files: changePolicy.changed_files,
    preflight: preflight.preflight,
    companion: compResult.companion,
    preflight_check: preflightCheck,
    runtime_check: runtimeCheck,
    scope_check: scopeCheck,
    lock_check: { ok: true, conflicts: [], suggested_execution_mode: null },
  };
  recordPreTaskResult(taskId, output);
  console.log(JSON.stringify(output, null, 2));
}

const { cmd, args } = parseArgs();

if (cmd === "pre-task") preTask(args);
else {
  console.error(JSON.stringify({ ok: false, error: "Usage: check.ts pre-task --taskId=t-025" }));
  process.exit(1);
}
