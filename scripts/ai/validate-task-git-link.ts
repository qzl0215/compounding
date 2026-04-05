const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { attachChangePacketAliases, buildChangePacket } = require("./lib/change-policy.ts");
const { parseTaskContract, parseTaskMachineFacts } = require(path.join(process.cwd(), "shared", "task-contract.ts"));
const {
  deriveCompatTaskMachine,
  deriveTaskStatusFromStateId,
  getTaskModeLabel,
} = require(path.join(process.cwd(), "shared", "task-state-machine.ts"));
const { normalizeBranchCleanupRecord } = require(path.join(process.cwd(), "shared", "branch-cleanup.ts"));
const { collectTaskIdentityErrors, taskIdFromPath } = require(path.join(process.cwd(), "shared", "task-identity.ts"));
const {
  findGovernanceGapRecord,
  readGovernanceGapRecords,
  GOVERNANCE_GAPS_PATH,
} = require(path.join(process.cwd(), "shared", "governance-gap-contract.ts"));
const { readCompanion } = require("../coord/lib/task-meta.ts");

const root = process.cwd();
const CURRENT_STATE_PATH = "memory/project/current-state.md";
const ALLOWED_WRITEBACK_TARGETS = new Set(["Current", "Code Index", "Tests"]);
const GOVERNANCE_TRUTH_SINK_PREFIXES = Object.freeze([
  CURRENT_STATE_PATH,
  "code_index/",
  "tests/",
  "scripts/ai/validate-",
]);

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
      delivery_track: parsedMachine.deliveryTrack,
    });
  return {
    id: taskIdFromPath(pathname),
    shortId: parsed.shortId,
    rawShortId: parsed.shortId,
    path: pathname,
    title: parsed.title,
    linkedGap: parsed.linkedGap,
    fromAssertion: parsed.fromAssertion,
    writebackTargets: parsed.writebackTargets,
    deliveryResult: parsed.deliveryResult,
    updateTrace: parsedMachine.updateTrace,
    status: deriveTaskStatusFromStateId(machine.state_id),
    stateId: machine.state_id,
    modeId: machine.mode_id,
    modeLabel: getTaskModeLabel(machine.mode_id),
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

function validateTask(task, changedFiles, errors) {
  if (!task.status) {
    errors.push(`${task.path}: 缺少状态。`);
    return;
  }

  if (!task.modeId || !task.modeLabel) {
    errors.push(`${task.path}: 缺少 canonical mode 机器事实。`);
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

  validateGovernanceBinding(task, changedFiles, errors);
}

function validateGovernanceBinding(task, changedFiles, errors) {
  const governanceRecords = readGovernanceGapRecords(root);
  const reverseLinkedRecord = governanceRecords.find((record) => record.linkedTasks.includes(task.id));
  const hasGovernanceFields = Boolean(task.linkedGap || task.fromAssertion || task.writebackTargets.length);

  if (!reverseLinkedRecord && !hasGovernanceFields) {
    return;
  }

  if (!task.linkedGap || !task.fromAssertion || task.writebackTargets.length === 0) {
    errors.push(`${task.path}: 治理绑定不完整，必须同时声明 linked_gap、from_assertion 和 writeback_targets。`);
    return;
  }

  const record = findGovernanceGapRecord(task.linkedGap, root);
  if (!record) {
    errors.push(`${task.path}: linked_gap 不存在于 ${GOVERNANCE_GAPS_PATH}：${task.linkedGap}`);
    return;
  }

  if (String(record.status || "").trim().toLowerCase() === "closed" && !record.linkedTasks.includes(task.id)) {
    errors.push(`${task.path}: linked_gap 已关闭，不能继续绑定新 task：${task.linkedGap}`);
  }
  if (record.fromAssertion && record.fromAssertion !== task.fromAssertion) {
    errors.push(`${task.path}: from_assertion 与治理 gap 主源不一致，应为 ${record.fromAssertion}。`);
  }
  if (!record.linkedTasks.includes(task.id)) {
    errors.push(`${task.path}: 治理 gap 主源未回写 linked_tasks：${task.id}`);
  }

  const invalidTargets = task.writebackTargets.filter((target) => !ALLOWED_WRITEBACK_TARGETS.has(target));
  if (invalidTargets.length > 0) {
    errors.push(`${task.path}: writeback_targets 包含不允许的目标：${invalidTargets.join(", ")}`);
  }

  validateWritebackTargets(task, changedFiles, errors);
}

function validateWritebackTargets(task, changedFiles, errors) {
  for (const target of task.writebackTargets) {
    if (target === "Current") {
      if (!changedFiles.includes(CURRENT_STATE_PATH)) {
        errors.push(`${task.path}: writeback_targets 声明了 Current，但没有命中 ${CURRENT_STATE_PATH}。`);
      }
      if (!traceReferences(task.updateTrace?.memory, CURRENT_STATE_PATH)) {
        errors.push(`${task.path}: writeback_targets 声明了 Current，但更新痕迹[记忆] 没有回写 ${CURRENT_STATE_PATH}。`);
      }
      continue;
    }

    if (target === "Code Index") {
      if (!changedFiles.some((file) => file.startsWith("code_index/"))) {
        errors.push(`${task.path}: writeback_targets 声明了 Code Index，但没有命中 code_index/*。`);
      }
      if (!traceMentionsIndex(task.updateTrace?.index)) {
        errors.push(`${task.path}: writeback_targets 声明了 Code Index，但更新痕迹[索引] 仍显示未更新。`);
      }
      continue;
    }

    if (target === "Tests") {
      if (!changedFiles.some((file) => isTestEvidenceFile(file))) {
        errors.push(`${task.path}: writeback_targets 声明了 Tests，但没有命中测试或验证守护入口。`);
      }
    }
  }

  if (task.status === "done" && task.writebackTargets.length > 0 && !deliveryResultMentionsTargets(task.deliveryResult, task.writebackTargets)) {
    errors.push(`${task.path}: governance task 已完成，但交付结果没有说明已回写的 truth sink。`);
  }
}

function traceReferences(value, expectedPath) {
  const normalized = cleanValue(value);
  if (!normalized || normalized.startsWith("no change")) {
    return false;
  }
  return normalized.includes(expectedPath);
}

function traceMentionsIndex(value) {
  const normalized = cleanValue(value);
  if (!normalized || normalized.startsWith("no change")) {
    return false;
  }
  return normalized.includes("code_index/");
}

function isTestEvidenceFile(file) {
  return (
    /^tests\//.test(file) ||
    /\/__tests__\//.test(file) ||
    /^scripts\/ai\/validate-[^/]+\.ts$/.test(file)
  );
}

function deliveryResultMentionsTargets(deliveryResult, targets) {
  const normalized = cleanValue(deliveryResult).toLowerCase();
  if (!normalized || normalized === "未交付") {
    return false;
  }
  return targets.every((target) => normalized.includes(target.toLowerCase()));
}

function isGovernanceTruthSinkChange(file) {
  return GOVERNANCE_TRUTH_SINK_PREFIXES.some((prefix) => file === prefix || file.startsWith(prefix));
}

function main() {
  const changePacket = buildChangePacket(root, { mode: "recent" });
  const errors = [];
  const activeBranch = currentBranch();
  const changedTaskPaths = changePacket.changed_files.filter((file) => /^tasks\/queue\/.+\.md$/.test(file));
  const allTasks = listTaskPaths().map((taskPath) => parseTask(taskPath));
  const branchMatchedTasks = activeBranch.startsWith("codex/")
    ? allTasks.filter((task) => cleanValue(task.branch) === activeBranch)
    : [];
  const governanceSinkTouched = changePacket.changed_files.some((file) => isGovernanceTruthSinkChange(file));
  const governanceTasks =
    governanceSinkTouched || changePacket.policy.strict_task_binding
      ? branchMatchedTasks.filter((task) => Boolean(task.linkedGap || task.fromAssertion || task.writebackTargets.length))
      : [];
  const relevantTasks = Array.from(
    new Map(
      [
        ...allTasks.filter((task) => changedTaskPaths.includes(task.path)),
        ...branchMatchedTasks,
        ...governanceTasks,
      ].map((task) => [task.path, task])
    ).values()
  );

  errors.push(
    ...collectTaskIdentityErrors(relevantTasks.map((task) => ({ id: task.id, shortId: task.rawShortId, path: task.path })))
  );

  const snapshots = relevantTasks.map((task) => {
    validateTask(task, changePacket.changed_files, errors);
    const snapshot = getTaskGitSnapshot(task);
    return {
      id: task.id,
      short_id: task.shortId,
      path: task.path,
      status: task.status,
      state_id: task.stateId,
      mode_id: task.modeId,
      mode_label: task.modeLabel,
      branch: snapshot.branch,
      merged_to_main: snapshot.mergedToMain,
      has_local_branch: snapshot.hasLocalBranch,
      effective_commit: snapshot.effectiveCommit ? git(["rev-parse", "--short", snapshot.effectiveCommit]).output : "",
    };
  });

  if (changePacket.policy.strict_task_binding && activeBranch.startsWith("codex/")) {
    if (branchMatchedTasks.length === 0) {
      errors.push(`当前分支 ${activeBranch} 没有对应的 task 绑定。`);
    }
  }

  const ok = errors.length === 0;
  const payload = attachChangePacketAliases({
    ok,
    tasks: snapshots,
    errors,
    changed_task_paths: changedTaskPaths,
    validated_task_paths: relevantTasks.map((task) => task.path),
    skipped_task_binding: !changePacket.policy.strict_task_binding,
  }, changePacket);
  console.log(JSON.stringify(payload, null, 2));
  if (!ok) {
    process.exit(1);
  }
}

main();
