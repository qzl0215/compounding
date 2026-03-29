const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { listTaskRecords, resolveTaskId, resolveTaskRecord } = require("../ai/lib/task-resolver.ts");
const { parseTaskContract, parseTaskMachineFacts } = require("../../shared/task-contract.ts");
const {
  deriveCompatTaskMachine,
  deriveTaskStatusFromStateId,
  getTaskModeLabel,
  getTaskStateLabel,
} = require("../../shared/task-state-machine.ts");
const { reconcileReleaseRegistry } = require("../../shared/release-registry.ts");
const {
  buildHarnessSnapshotFromReducer,
  reduceHarnessEvents,
} = require("../../shared/harness/reducer.ts");
const { decideNextHarnessAction } = require("../../shared/harness/actions.ts");
const { resolveRepositoryRoot, resolveSharedRuntimeRoot } = require("../../shared/git-workspace.ts");
const { readCompanion } = require("../coord/lib/task-meta.ts");
const { checkLocks, collectRuntimeStatuses, runPreflight, runScopeGuard, summarizePreflight } = require("../coord/lib/pre-task-runtime.ts");

function workspaceRoot() {
  return resolveRepositoryRoot(process.cwd());
}

function harnessPaths() {
  const runtimeRoot = resolveSharedRuntimeRoot(process.cwd());
  const harnessDir = path.join(runtimeRoot, "shared", "harness");
  return {
    runtimeRoot,
    harnessDir,
    eventsPath: path.join(harnessDir, "events.jsonl"),
    snapshotPath: path.join(harnessDir, "live-snapshot.json"),
  };
}

function ensureHarnessLayout() {
  const paths = harnessPaths();
  fs.mkdirSync(paths.harnessDir, { recursive: true });
  return paths;
}

function now() {
  return new Date().toISOString();
}

function currentBranchName() {
  try {
    return spawnSync("git", ["branch", "--show-current"], {
      cwd: workspaceRoot(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).stdout.trim();
  } catch {
    return "";
  }
}

function canonicalTaskId(taskLike) {
  if (!taskLike) return null;
  return resolveTaskId(taskLike, workspaceRoot()) || null;
}

function makeEventId(prefix = "evt") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readHarnessEvents(options = {}) {
  const { eventsPath } = ensureHarnessLayout();
  if (!fs.existsSync(eventsPath)) return [];
  const limit = Number(options.limit || 0);
  const rows = fs
    .readFileSync(eventsPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return limit > 0 ? rows.slice(-limit) : rows;
}

function appendHarnessEvent(eventType, payload = {}, options = {}) {
  const { eventsPath } = ensureHarnessLayout();
  const event = {
    event_id: makeEventId("harness"),
    event_type: eventType,
    recorded_at: options.recorded_at || now(),
    source: options.source || null,
    task_id: canonicalTaskId(options.task_id) || options.task_id || null,
    payload,
  };
  fs.appendFileSync(eventsPath, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

function readHarnessSnapshot() {
  const { snapshotPath } = ensureHarnessLayout();
  if (!fs.existsSync(snapshotPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  } catch {
    return null;
  }
}

function writeHarnessSnapshot(snapshot) {
  const { snapshotPath } = ensureHarnessLayout();
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + "\n", "utf8");
  return snapshot;
}

function readTaskContent(taskPath) {
  return fs.readFileSync(path.join(workspaceRoot(), taskPath), "utf8");
}

function taskSortWeight(stateId) {
  const weights = {
    blocked: 0,
    acceptance_pending: 1,
    release_preparing: 2,
    reviewing: 3,
    review_pending: 4,
    executing: 5,
    ready: 6,
    planning: 7,
    released: 8,
    rolled_back: 9,
    abandoned: 10,
  };
  return weights[stateId] ?? 99;
}

function taskNumericWeight(shortId) {
  const match = String(shortId || "").match(/t-(\d+)/);
  return match ? Number(match[1]) : 0;
}

function listTaskSnapshots() {
  return listTaskRecords(workspaceRoot())
    .map((record) => {
      const content = readTaskContent(record.path);
      const contract = parseTaskContract(record.path, content);
      const machineFacts = parseTaskMachineFacts(content);
      const companion = readCompanion(record.id);
      const fallbackMachine =
        !companion?.contract_hash &&
        deriveCompatTaskMachine({
          task_status: contract.status,
          current_mode: machineFacts.currentMode,
          delivery_track: machineFacts.deliveryTrack,
        });
      const machine = fallbackMachine || companion?.machine || deriveCompatTaskMachine({});
      const decisionCardPath = companion?.artifacts?.decision_cards?.slice(-1)[0]?.path || null;
      const diffSummaryPath = companion?.artifacts?.diff_summaries?.slice(-1)[0]?.path || null;
      const latestReleaseId =
        companion?.lifecycle?.release_handoff?.release_id ||
        companion?.artifacts?.release_notes?.slice(-1)[0]?.release_id ||
        null;
      return {
        ...contract,
        branch_name: machineFacts.branch || companion?.branch_name || `codex/${record.id}`,
        current_mode: companion?.current_mode || getTaskModeLabel(machine.mode_id, workspaceRoot()),
        machine,
        planned_files: companion?.planned_files || [],
        planned_modules: companion?.planned_modules || [],
        latest_release_id: latestReleaseId,
        latest_decision_card_path: decisionCardPath,
        latest_diff_summary_path: diffSummaryPath,
      };
    })
    .sort((left, right) => {
      return taskSortWeight(left.machine.state_id) - taskSortWeight(right.machine.state_id) || taskNumericWeight(right.shortId) - taskNumericWeight(left.shortId);
    });
}

function pickPreferredTaskId(tasks, events) {
  const branch = currentBranchName();
  const branchMatch =
    tasks.find((task) => task.branch_name === branch) ||
    tasks.find((task) => branch.includes(task.id) || branch.includes(task.shortId));
  if (branchMatch) {
    return branchMatch.id;
  }

  const recentTaskId = [...events]
    .reverse()
    .map((event) => canonicalTaskId(event.task_id))
    .find(Boolean);
  return recentTaskId || null;
}

function pickActiveTask(tasks, preferredTaskId = null) {
  if (preferredTaskId) {
    const preferred = tasks.find((task) => task.id === preferredTaskId);
    if (preferred) return preferred;
  }
  return tasks.find((task) => !["released", "rolled_back", "abandoned"].includes(task.machine.state_id)) || tasks[0] || null;
}

function runStatusScript(scriptPath, env = {}) {
  const result = spawnSync("node", ["--experimental-strip-types", scriptPath], {
    cwd: workspaceRoot(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) return null;
  try {
    return JSON.parse(String(result.stdout || "{}"));
  } catch {
    return null;
  }
}

function readRuntimeCompatibility() {
  const prod = runStatusScript(path.join(workspaceRoot(), "scripts", "local-runtime", "status-prod.ts"), {
    AI_OS_RELEASE_ROOT: resolveSharedRuntimeRoot(process.cwd()),
  });
  const dev = runStatusScript(path.join(workspaceRoot(), "scripts", "local-runtime", "status-preview.ts"), {
    AI_OS_RELEASE_ROOT: resolveSharedRuntimeRoot(process.cwd()),
  });
  return { prod, dev };
}

function readRegistryCompatibility() {
  const registryModule = require("../release/registry.ts");
  const raw = registryModule.readRegistry();
  return reconcileReleaseRegistry(raw).registry;
}

function buildLiveState(activeTask, compatibility) {
  const preflight = summarizePreflight(runPreflight());
  const lockCheck = activeTask ? checkLocks(activeTask.shortId, activeTask.planned_files) : { ok: true, conflicts: [] };
  const scopeCheck = activeTask ? runScopeGuard(activeTask.shortId) : { ok: true, scope_summary: "当前没有 active contract。" };
  const runtimeCheck = collectRuntimeStatuses();
  const actualFiles = Array.isArray(scopeCheck.actual_files) ? scopeCheck.actual_files : [];
  const contractOnlyDirty =
    Boolean(activeTask) &&
    actualFiles.length > 0 &&
    actualFiles.every((filePath) => filePath === activeTask.path);
  const workflow = activeTask
    ? {
        task_id: activeTask.id,
        task_path: activeTask.path,
        state_id: activeTask.machine.state_id,
        state_label: getTaskStateLabel(activeTask.machine.state_id, workspaceRoot()),
        mode_id: activeTask.machine.mode_id,
        mode_label: getTaskModeLabel(activeTask.machine.mode_id, workspaceRoot()),
        delivery_track: activeTask.machine.delivery_track,
        blocked_reason: activeTask.machine.blocked_reason || null,
        last_event_id: activeTask.machine.last_transition?.event_id || null,
      }
    : {
        task_id: null,
        task_path: null,
        state_id: "idle",
        state_label: "空闲",
        mode_id: null,
        mode_label: null,
        delivery_track: "undetermined",
        blocked_reason: null,
        last_event_id: null,
      };
  const hygieneBlockers = [
    ...preflight.blockers
      .filter((item) => !(contractOnlyDirty && item.issue === "工作区未清理"))
      .map((item) => item.issue),
    ...(lockCheck.ok ? [] : lockCheck.conflicts.map((item) => `锁冲突：${item.target}`)),
    ...(scopeCheck.ok ? [] : [scopeCheck.scope_summary || "scope guard 未通过"]),
  ];
  const prod = runtimeCheck.statuses.find((item) => item.profile === "prod") || compatibility.local_runtime;
  const dev = runtimeCheck.statuses.find((item) => item.profile === "dev") || compatibility.local_preview;
  const targetChannel =
    activeTask?.machine.delivery_track === "preview_release" &&
    ["release_preparing", "acceptance_pending"].includes(activeTask.machine.state_id)
      ? "dev"
      : activeTask
        ? "prod"
        : null;
  const targetReleaseId =
    activeTask?.latest_release_id ||
    (targetChannel === "dev" ? compatibility.pending_dev_release_id : compatibility.active_release_id);
  const observedReleaseId = targetChannel === "dev" ? dev?.runtime_release_id || null : prod?.runtime_release_id || null;
  const aligned = !targetReleaseId || targetReleaseId === observedReleaseId;
  const runtimeAlignment = {
    target_channel: targetChannel,
    target_release_id: targetReleaseId || null,
    observed_release_id: observedReleaseId || null,
    aligned,
    reason: targetReleaseId
      ? aligned
        ? `目标版本 ${targetReleaseId} 已在 ${targetChannel || "prod"} 运行态观察到。`
        : `目标版本 ${targetReleaseId} 尚未在 ${targetChannel || "prod"} 运行态观察到。`
      : "当前没有待对齐的 release。",
  };

  return {
    workflow,
    hygiene: {
      branch: preflight.payload.branch || activeTask?.branch_name || "",
      head_sha: preflight.payload.head_sha || null,
      has_upstream: Boolean(preflight.payload.has_upstream),
      worktree_clean: preflight.payload.worktree_clean !== false,
      blockers: hygieneBlockers,
      notes: [
        ...preflight.notes.map((item) => item.issue),
        ...(contractOnlyDirty ? ["当前只有任务合同变更，已降级为可继续的 hygiene note。"] : []),
        ...(runtimeCheck.blockers.length > 0
          ? runtimeCheck.blockers.map((item) => `${item.label || item.profile}：${item.reason}`)
          : []),
      ],
    },
    runtime_alignment: runtimeAlignment,
  };
}

function buildCompatibilitySummary(tasks, registry, runtimes) {
  return {
    runtime_root: resolveSharedRuntimeRoot(process.cwd()),
    active_release_id: registry.active_release_id || null,
    pending_dev_release_id: registry.pending_dev_release_id || null,
    active_task_count: tasks.filter((task) => ["executing", "review_pending", "reviewing", "release_preparing"].includes(task.machine.state_id)).length,
    blocked_task_count: tasks.filter((task) => task.machine.state_id === "blocked").length,
    local_runtime: runtimes.prod,
    local_preview: runtimes.dev,
  };
}

function contractFromTask(task) {
  if (!task) return null;
  return {
    contract_id: `contract:${task.id}`,
    task_id: task.id,
    task_path: task.path,
    short_id: task.shortId,
    title: task.title,
    summary: task.summary,
    why_now: task.whyNow,
    boundary: task.boundary,
    done_when: task.doneWhen,
    constraints: task.constraints,
    risk: task.risk,
    delivery_track: task.machine.delivery_track,
    state_id: task.machine.state_id,
    mode_id: task.machine.mode_id,
    branch_name: task.branch_name,
    latest_release_id: task.latest_release_id,
  };
}

function intentFromTask(task, source) {
  if (!task) return null;
  return {
    intent_id: `intent:${task.id}`,
    task_id: task.id,
    summary: task.summary,
    why_now: task.whyNow,
    success_criteria: task.doneWhen,
    constraints: task.constraints,
    acceptance_owner: "human",
    created_at: now(),
    source,
  };
}

function applyActiveTaskCompatibility(snapshot, activeTask, liveState) {
  if (!activeTask) return snapshot;
  snapshot.active_contract =
    snapshot.active_contract?.task_id === activeTask.id
      ? {
          ...snapshot.active_contract,
          ...contractFromTask(activeTask),
        }
      : contractFromTask(activeTask);
  if (!snapshot.active_intent || snapshot.active_intent.task_id !== activeTask.id) {
    snapshot.active_intent = intentFromTask(activeTask, "compat.task_contract");
  }
  snapshot.next_action = decideNextHarnessAction(
    snapshot.active_contract,
    liveState.workflow,
    liveState.hygiene,
    liveState.runtime_alignment,
  );
  snapshot.current_executor = {
    role: snapshot.next_action?.owner || "harness",
    reason: snapshot.next_action?.reason || "当前没有待执行动作。",
  };
  return snapshot;
}

function syncHarnessSnapshot() {
  const tasks = listTaskSnapshots();
  const events = readHarnessEvents();
  const activeTask = pickActiveTask(tasks, pickPreferredTaskId(tasks, events));
  const registry = readRegistryCompatibility();
  const runtimes = readRuntimeCompatibility();
  const compatibility = buildCompatibilitySummary(tasks, registry, {
    prod: runtimes.prod || collectRuntimeStatuses().statuses.find((item) => item.profile === "prod"),
    dev: runtimes.dev || collectRuntimeStatuses().statuses.find((item) => item.profile === "dev"),
  });
  const reduced = reduceHarnessEvents(events);
  const liveState = buildLiveState(activeTask, compatibility);
  const snapshot = buildHarnessSnapshotFromReducer(reduced, compatibility, liveState);
  return writeHarnessSnapshot(applyActiveTaskCompatibility(snapshot, activeTask, liveState));
}

function syncTaskMaterialization(taskLike, options = {}) {
  const record = resolveTaskRecord(taskLike, workspaceRoot());
  if (!record) {
    return { ok: false, error: `Unknown task: ${taskLike}` };
  }
  const content = readTaskContent(record.path);
  const contract = parseTaskContract(record.path, content);
  const machineFacts = parseTaskMachineFacts(content);
  appendHarnessEvent(
    "intent.created",
    {
      intent: {
        intent_id: `intent:${record.id}`,
        task_id: record.id,
        summary: contract.summary,
        why_now: contract.whyNow,
        success_criteria: contract.doneWhen,
        constraints: contract.constraints,
        acceptance_owner: "human",
        created_at: now(),
        source: options.source || "ai:create-task",
      },
    },
    { source: options.source || "ai:create-task", task_id: record.id },
  );
  appendHarnessEvent(
    "contract.materialized",
    {
      contract: {
        contract_id: `contract:${record.id}`,
        task_id: record.id,
        task_path: record.path,
        short_id: contract.shortId,
        title: contract.title,
        summary: contract.summary,
        why_now: contract.whyNow,
        boundary: contract.boundary,
        done_when: contract.doneWhen,
        constraints: contract.constraints,
        risk: contract.risk,
        delivery_track: machineFacts.deliveryTrack || "undetermined",
        state_id: "planning",
        mode_id: "planning",
        branch_name: machineFacts.branch || options.branch_name || "",
        latest_release_id: null,
      },
      task_path: record.path,
      title: contract.title,
    },
    { source: options.source || "ai:create-task", task_id: record.id },
  );
  return { ok: true, snapshot: syncHarnessSnapshot(), task_id: record.id };
}

function recordHarnessTaskTransition(taskId, companion, source) {
  const canonicalId = canonicalTaskId(companion.task_id || taskId) || companion.task_id || taskId;
  appendHarnessEvent(
    "task.transitioned",
    {
      task_id: canonicalId,
      task_path: companion.task_path || null,
      state_id: companion.machine?.state_id || "planning",
      mode_id: companion.machine?.mode_id || "planning",
      delivery_track: companion.machine?.delivery_track || "undetermined",
      blocked_reason: companion.machine?.blocked_reason || null,
    },
    { source: source || "coord:task:transition", task_id: canonicalId },
  );
  return syncHarnessSnapshot();
}

function recordHarnessPreflight(taskId, result) {
  const canonicalId = canonicalTaskId(taskId) || taskId;
  appendHarnessEvent(
    "preflight.observed",
    {
      ok: Boolean(result.ok),
      blockers: result.blockers || [],
      preflight: result.preflight_check?.payload || result.preflight || null,
      decision_card_path: result.decision_card?.path || null,
    },
    { source: "coord:preflight", task_id: canonicalId },
  );
  return syncHarnessSnapshot();
}

function recordHarnessHandoff(taskId, note) {
  const canonicalId = canonicalTaskId(taskId) || taskId;
  appendHarnessEvent(
    "handoff.recorded",
    {
      summary: note?.summary || null,
      git_head: note?.git_head || null,
    },
    { source: note?.source || "coord:task:handoff", task_id: canonicalId },
  );
  return syncHarnessSnapshot();
}

function recordHarnessReview(taskId, review) {
  const canonicalId = canonicalTaskId(taskId) || taskId;
  appendHarnessEvent(
    "review.recorded",
    {
      ok: Boolean(review?.ok),
      merge_decision: review?.merge_decision || null,
      diff_summary_path: review?.diff_summary?.path || null,
    },
    { source: "coord:review:run", task_id: canonicalId },
  );
  return syncHarnessSnapshot();
}

function recordHarnessRelease(taskId, payload = {}) {
  const canonicalId = canonicalTaskId(taskId) || taskId;
  appendHarnessEvent(
    "release.recorded",
    {
      release_id: payload.release_id || null,
      channel: payload.channel || null,
      acceptance_status: payload.acceptance_status || null,
      status: payload.status || null,
    },
    { source: payload.source || "release", task_id: canonicalId },
  );
  return syncHarnessSnapshot();
}

function recordHarnessRuntime(profile, fact, source = "harness:observe-runtime") {
  appendHarnessEvent(
    "runtime.observed",
    {
      fact: {
        profile,
        status: fact.status,
        runtime_release_id: fact.runtime_release_id || null,
        current_release_id: fact.current_release_id || null,
        drift: Boolean(fact.drift),
        observed_at: now(),
        reason: fact.reason || "",
      },
    },
    { source, task_id: null },
  );
  return syncHarnessSnapshot();
}

module.exports = {
  appendHarnessEvent,
  ensureHarnessLayout,
  harnessPaths,
  readHarnessEvents,
  readHarnessSnapshot,
  recordHarnessHandoff,
  recordHarnessPreflight,
  recordHarnessRelease,
  recordHarnessReview,
  recordHarnessRuntime,
  recordHarnessTaskTransition,
  syncHarnessSnapshot,
  syncTaskMaterialization,
  workspaceRoot,
};
