const { getChangePolicy } = require("../../ai/lib/change-policy.ts");
const { ensureCompanion } = require("./task-meta.ts");
const { recordPreTaskResult } = require("./companion-lifecycle.ts");
const { buildRetroContext, finishActiveStage, recordBlocker, startActiveStage } = require("./task-activity.ts");
const { createDecisionCard } = require("./pre-task-decision.ts");
const {
  checkLocks,
  collectRuntimeStatuses,
  runPreflight,
  runScopeGuard,
  summarizePreflight,
} = require("./pre-task-runtime.ts");

const ROOT = process.cwd();
const TASK_REQUIRED_CLASSES = new Set(["structural", "release"]);

function parseFlagArgs(argv = []) {
  const args = {};
  for (const arg of argv) {
    if (!arg || arg === "--" || !arg.startsWith("--")) continue;
    const [key, val] = arg.slice(2).split("=");
    if (!key) continue;
    args[key] = val !== undefined ? val : true;
  }
  return args;
}

function buildBaseOutput(changePolicy, guardLevel, taskId) {
  return {
    guard_level: guardLevel,
    task_id: taskId || null,
    change_class: changePolicy.change_class,
    policy: changePolicy.policy,
    changed_files: changePolicy.changed_files,
  };
}

function attachRetroContext(payload, retroContext = {}) {
  return {
    ...payload,
    iteration_digest_path: retroContext.iteration_digest_path || null,
    retro_candidates_path: retroContext.retro_candidates_path || null,
    retro_hints: Array.isArray(retroContext.retro_hints) ? retroContext.retro_hints : [],
  };
}

function taskGuardRequired(changePolicy) {
  return TASK_REQUIRED_CLASSES.has(changePolicy.change_class);
}

function buildTaskBindingBlocker(changePolicy) {
  return {
    step: "task_binding",
    issue: "结构或发布改动必须绑定 taskId",
    details: {
      change_class: changePolicy.change_class,
      suggestion: "重新执行 `pnpm preflight -- --taskId=t-xxx`。",
    },
  };
}

function runBasicPreflight(changePolicy) {
  const preflight = runPreflight();
  const output = buildBaseOutput(changePolicy, "basic", null);

  if (!preflight.ok) {
    return {
      exitCode: 1,
      payload: {
        ok: false,
        step: "preflight",
        error: preflight.error,
        preflight,
        reason: "基础 preflight 执行失败。",
        ...output,
      },
    };
  }

  const preflightCheck = summarizePreflight(preflight);
  const blockers = [...preflightCheck.blockers];
  const missingTask = taskGuardRequired(changePolicy);
  if (missingTask) {
    blockers.push(buildTaskBindingBlocker(changePolicy));
  }

  const ok = blockers.length === 0;
  return {
    exitCode: ok ? 0 : 1,
    payload: {
      ok,
      step: "preflight_gate",
      preflight: preflight.preflight,
      preflight_check: preflightCheck,
      blockers,
      reason: missingTask
        ? "当前变更已进入 structural/release 边界，必须补 taskId 后重新执行。"
        : ok
          ? "基础 preflight 已通过。"
          : "基础 preflight 检测到 git/worktree blocker。",
      ...output,
    },
  };
}

function collectSearchCheck(changePolicy, companion) {
  const evidence = companion?.artifacts?.search_evidence || [];
  const latest = evidence.length > 0 ? evidence[evidence.length - 1] : null;
  const required = taskGuardRequired(changePolicy);
  return {
    required,
    recorded: Boolean(latest),
    completion_mode: companion?.completion_mode || "close_full_contract",
    sources: latest?.sources || [],
    conclusion: latest?.conclusion || "",
    note:
      required && !latest
        ? "若这次涉及 unfamiliar pattern / infra / runtime capability，先用 coord:task:search 记录最小搜索结论；若只是已有模式延伸，可继续。"
        : latest
          ? "已记录最小 search evidence。"
          : "当前无需 search evidence。",
  };
}

function runTaskPreflight(changePolicy, taskId) {
  const output = buildBaseOutput(changePolicy, "task", taskId);
  if (!taskId) {
    return {
      exitCode: 1,
      payload: {
        ok: false,
        error: "taskId is required. Use --taskId=t-025",
        reason: "完整 task guard 必须绑定 taskId。",
        ...output,
      },
    };
  }

  const retroContext = buildRetroContext(taskId);
  const preflightStartedAt = new Date().toISOString();
  const preflight = runPreflight();
  if (!preflight.ok) {
    return {
      exitCode: 1,
      payload: attachRetroContext({
        ok: false,
        step: "preflight",
        error: preflight.error,
        preflight,
        reason: "完整 task guard 在基础 preflight 阶段失败。",
        ...output,
      }, retroContext),
    };
  }

  const compResult = ensureCompanion(taskId);
  if (!compResult.ok) {
    return {
      exitCode: 1,
      payload: {
        ok: false,
        step: "task_companion",
        error: compResult.error,
        reason: "无法初始化 task companion。",
        ...attachRetroContext(output, retroContext),
      },
    };
  }

  const preflightCheck = summarizePreflight(preflight);
  const searchCheck = collectSearchCheck(changePolicy, compResult.companion);
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

  startActiveStage(taskId, "preflight", {
    source: "coord:preflight",
    recordedAt: preflightStartedAt,
    status: "running",
    reason: "开始执行完整 task guard。",
  });
  if (blockers.length > 0) {
    for (const blocker of blockers) {
      const stage = blocker.step === "runtime_check" || blocker.step === "scope_guard" || blocker.step === "lock_check" ? "preflight" : "preflight";
      recordBlocker(taskId, stage, {
        source: `coord:${blocker.step || "preflight"}`,
        status: "blocked",
        reason: blocker.issue || "task guard blocker",
        relatedDocs: ["AGENTS.md", "docs/DEV_WORKFLOW.md"],
      });
    }
    finishActiveStage(taskId, "preflight", {
      source: "coord:preflight",
      status: "blocked",
      reason: "完整 task guard 检测到 blocker。",
    });
    const decisionCard = createDecisionCard(taskId, preflightCheck, runtimeCheck, scopeCheck, lockCheck);
    const payload = attachRetroContext({
      ok: false,
      step: "pre_task_guard",
      blockers,
      preflight_check: preflightCheck,
      search_check: searchCheck,
      runtime_check: runtimeCheck,
      scope_check: scopeCheck,
      lock_check: {
        ok: lockCheck.ok,
        conflicts: lockCheck.conflicts,
        suggested_execution_mode: lockCheck.suggested_execution_mode,
      },
      decision_card: decisionCard,
      reason: "完整 task guard 检测到 runtime、scope、lock 或 git blocker，请先处理后重试。",
      ...output,
    }, retroContext);
    recordPreTaskResult(taskId, payload);
    return { exitCode: 1, payload };
  }

  finishActiveStage(taskId, "preflight", {
    source: "coord:preflight",
    recordedAt: new Date().toISOString(),
    status: "passed",
    reason: "完整 task guard 已通过。",
  });
  startActiveStage(taskId, "execution", {
    source: "coord:task:start",
    status: "running",
    reason: "task guard 已通过，进入工程执行。",
  });
  const payload = attachRetroContext({
    ok: true,
    preflight: preflight.preflight,
    companion: compResult.companion,
    preflight_check: preflightCheck,
    search_check: searchCheck,
    runtime_check: runtimeCheck,
    scope_check: scopeCheck,
    lock_check: { ok: true, conflicts: [], suggested_execution_mode: null },
    reason: "完整 task guard 已通过。",
    ...output,
  }, retroContext);
  recordPreTaskResult(taskId, payload);
  return { exitCode: 0, payload };
}

function runPreflightGate(args = {}, options = {}) {
  const changePolicy = getChangePolicy(ROOT);
  const taskId = typeof args.taskId === "string" && args.taskId.trim() ? args.taskId.trim() : null;
  if (taskId || options.requireTaskId) {
    return runTaskPreflight(changePolicy, taskId);
  }
  return runBasicPreflight(changePolicy);
}

module.exports = {
  parseFlagArgs,
  runPreflightGate,
};
