const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { getChangePolicy } = require("./lib/change-policy.ts");
const { parseTaskContract, parseTaskMachineFacts } = require(path.join(process.cwd(), "shared", "task-contract.ts"));
const {
  deriveCompatTaskMachine,
  deriveTaskStatusFromStateId,
  getTaskModeLabel,
  normalizeTaskModeId,
} = require(path.join(process.cwd(), "shared", "task-state-machine.ts"));
const { normalizeBranchCleanupRecord } = require(path.join(process.cwd(), "shared", "branch-cleanup.ts"));
const { collectTaskIdentityErrors, taskIdFromPath } = require(path.join(process.cwd(), "shared", "task-identity.ts"));
const { readCompanion } = require("../coord/lib/task-meta.ts");

const root = process.cwd();

function git(args) {
  try {
    return {
      ok: true,
      output: childProcess.execFileSync("git", args, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim(),
    };
  } catch (error) {
    return {
      ok: false,
      output: error instanceof Error ? error.message : "",
    };
  }
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function listTaskPaths() {
  const queueDir = path.join(root, "tasks", "queue");
  if (!fs.existsSync(queueDir)) {
    return [];
  }
  return fs
    .readdirSync(queueDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => path.posix.join("tasks/queue", name));
}

function parseTask(pathname) {
  const content = read(pathname);
  const parsed = parseTaskContract(pathname, content);
  const parsedMachine = parseTaskMachineFacts(content);
  const companion = readCompanion(parsed.id);
  const machine =
    companion?.machine ||
    deriveCompatTaskMachine({
      task_status: parsed.status,
      current_mode: parsedMachine.currentMode,
      delivery_track: parsedMachine.deliveryTrack,
    });
  return {
    id: taskIdFromPath(pathname),
    shortId: parsed.shortId,
    rawShortId: parsed.shortId,
    path: pathname,
    title: parsed.title,
    status: deriveTaskStatusFromStateId(machine.state_id),
    stateId: machine.state_id,
    modeId: machine.mode_id,
    currentMode: cleanValue(companion?.current_mode || parsedMachine.currentMode || getTaskModeLabel(machine.mode_id)),
    branch: cleanValue(companion?.branch_name || parsedMachine.branch || ""),
    recentCommit: cleanValue(companion?.lifecycle?.handoff?.git_head || parsedMachine.recentCommit || ""),
    branchCleanup: normalizeBranchCleanupRecord(companion?.artifacts?.branch_cleanup),
  };
}

function normalizeStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "已完成") return "done";
  if (normalized === "阻塞中") return "blocked";
  if (normalized === "进行中" || normalized === "in_progress") return "doing";
  if (normalized === "待开始") return "todo";
  return normalized || "todo";
}

function cleanValue(value) {
  return String(value || "").replace(/`/g, "").trim();
}

function isLegacyMainBranch(branch) {
  return branch === "main" || branch.startsWith("main ");
}

function isAutoCommit(value) {
  const normalized = cleanValue(value).toLowerCase();
  return !normalized || normalized === "pending" || normalized.startsWith("auto:");
}

function branchExists(branch) {
  return git(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]).ok;
}

function currentBranch() {
  const result = git(["branch", "--show-current"]);
  return result.ok ? result.output : "";
}

function hasDirtyWorktree() {
  const result = git(["status", "--short"]);
  return Boolean(result.ok && result.output.trim());
}

function branchHead(branch) {
  const result = git(["rev-parse", branch]);
  return result.ok ? result.output : "";
}

function commitExists(commit) {
  return Boolean(commit) && git(["cat-file", "-e", `${commit}^{commit}`]).ok;
}

function isMergedIntoMain(commit) {
  return Boolean(commit) && git(["merge-base", "--is-ancestor", commit, "main"]).ok;
}

function getTaskGitSnapshot(task) {
  const branch = cleanValue(task.branch);
  const activeBranch = currentBranch();
  const storedCommit = isAutoCommit(task.recentCommit) ? "" : cleanValue(task.recentCommit);
  const cleanupCommit = cleanValue(task.branchCleanup?.source_commit || "");
  const localBranch = branch && !isLegacyMainBranch(branch) && branchExists(branch);
  const effectiveCommit = localBranch ? branchHead(branch) : commitExists(cleanupCommit) ? cleanupCommit : commitExists(storedCommit) ? storedCommit : "";
  return {
    branch,
    effectiveCommit,
    activeBranch,
    dirtyWorktree: hasDirtyWorktree(),
    mergedToMain: isLegacyMainBranch(branch) || (branch !== activeBranch && isMergedIntoMain(effectiveCommit)),
    hasLocalBranch: localBranch,
  };
}

function isManagedCleanupState(task) {
  return ["scheduled", "deleted", "failed"].includes(String(task.branchCleanup?.overall_state || "").trim());
}

function allowsPlannedBranch(task, snapshot) {
  return task.status === "todo" && snapshot.branch && !snapshot.hasLocalBranch && !snapshot.effectiveCommit;
}

function validateTask(task, errors) {
  if (!task.status) {
    errors.push(`${task.path}: 缺少状态。`);
    return;
  }

  if (!task.currentMode) {
    errors.push(`${task.path}: 缺少当前模式机器事实。`);
  } else if (!normalizeTaskModeId(task.currentMode)) {
    errors.push(`${task.path}: 当前模式不在允许列表内。`);
  }

  const snapshot = getTaskGitSnapshot(task);

  if (task.status !== "done" && !snapshot.branch) {
    errors.push(`${task.path}: 非 done 任务必须能解析到分支绑定。`);
  }

  if (
    task.status !== "done" &&
    snapshot.branch &&
    !snapshot.hasLocalBranch &&
    !isLegacyMainBranch(snapshot.branch) &&
    snapshot.branch !== snapshot.activeBranch &&
    !allowsPlannedBranch(task, snapshot)
  ) {
    errors.push(`${task.path}: 已绑定分支，但本地无法读取该分支。`);
  }

  if (
    snapshot.branch &&
    !snapshot.effectiveCommit &&
    !isLegacyMainBranch(snapshot.branch) &&
    !(snapshot.branch === snapshot.activeBranch && snapshot.dirtyWorktree) &&
    !allowsPlannedBranch(task, snapshot) &&
    !(task.status === "done" && isManagedCleanupState(task))
  ) {
    errors.push(`${task.path}: 已绑定分支，但无法解析最近提交。`);
  }

  if (task.status === "done" && !snapshot.mergedToMain && !isManagedCleanupState(task)) {
    errors.push(`${task.path}: 任务标记为 done，但最近提交尚未并入 main。`);
  }

  if (task.status !== "done" && snapshot.mergedToMain) {
    errors.push(`${task.path}: 分支提交已并入 main，但任务状态仍不是 done。`);
  }
}

function main() {
  const changePolicy = getChangePolicy(root);
  const errors = [];
  const activeBranch = currentBranch();
  const changedTaskPaths = changePolicy.changed_files.filter((file) => /^tasks\/queue\/.+\.md$/.test(file));
  const allTasks = listTaskPaths().map((taskPath) => parseTask(taskPath));
  const branchMatchedTasks =
    changePolicy.policy.strict_task_binding && activeBranch.startsWith("codex/")
      ? allTasks.filter((task) => cleanValue(task.branch) === activeBranch)
      : [];
  const relevantTasks = Array.from(
    new Map(
      [...allTasks.filter((task) => changedTaskPaths.includes(task.path)), ...branchMatchedTasks].map((task) => [task.path, task])
    ).values()
  );

  errors.push(
    ...collectTaskIdentityErrors(relevantTasks.map((task) => ({ id: task.id, shortId: task.rawShortId, path: task.path })))
  );

  const snapshots = relevantTasks.map((task) => {
    validateTask(task, errors);
    const snapshot = getTaskGitSnapshot(task);
    return {
      id: task.id,
      short_id: task.shortId,
      path: task.path,
      status: task.status,
      state_id: task.stateId,
      mode_id: task.modeId,
      current_mode: task.currentMode,
      branch: snapshot.branch,
      merged_to_main: snapshot.mergedToMain,
      has_local_branch: snapshot.hasLocalBranch,
      effective_commit: snapshot.effectiveCommit ? git(["rev-parse", "--short", snapshot.effectiveCommit]).output : "",
    };
  });

  if (changePolicy.policy.strict_task_binding && activeBranch.startsWith("codex/")) {
    if (branchMatchedTasks.length === 0) {
      errors.push(`当前分支 ${activeBranch} 没有对应的 task 绑定。`);
    }
  }

  const ok = errors.length === 0;
  const payload = {
    ok,
    tasks: snapshots,
    errors,
    changed_task_paths: changedTaskPaths,
    validated_task_paths: relevantTasks.map((task) => task.path),
    change_class: changePolicy.change_class,
    policy: changePolicy.policy,
    skipped_task_binding: !changePolicy.policy.strict_task_binding,
  };
  console.log(JSON.stringify(payload, null, 2));
  if (!ok) {
    process.exit(1);
  }
}

main();
