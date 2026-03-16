const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");
const { extractSection, stripMarkdown } = require("./lib/markdown-sections.ts");

const root = process.cwd();
const queueDir = path.join(root, "tasks", "queue");

function git(args) {
  try {
    return {
      ok: true,
      output: childProcess.execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(),
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

function listTaskFiles() {
  return fs
    .readdirSync(queueDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => path.posix.join("tasks/queue", name));
}

function parseTask(pathname) {
  const content = read(pathname);
  return {
    path: pathname,
    status: normalizeStatus(stripMarkdown(extractSection(content, "status", root) || "")),
    currentMode: cleanValue(stripMarkdown(extractSection(content, "current_mode", root) || "")),
    branch: stripMarkdown(extractSection(content, "branch", root) || ""),
    recentCommit: stripMarkdown(extractSection(content, "recent_commit", root) || ""),
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

const ALLOWED_MODES = new Set(["战略澄清", "方案评审", "工程执行", "质量验收", "发布复盘"]);

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
  const localBranch = branch && !isLegacyMainBranch(branch) && branchExists(branch);
  const effectiveCommit = localBranch ? branchHead(branch) : commitExists(storedCommit) ? storedCommit : "";
  return {
    branch,
    effectiveCommit,
    activeBranch,
    dirtyWorktree: hasDirtyWorktree(),
    mergedToMain: isLegacyMainBranch(branch) || (branch !== activeBranch && isMergedIntoMain(effectiveCommit)),
    hasLocalBranch: localBranch,
  };
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
    errors.push(`${task.path}: 缺少当前模式。`);
  } else if (!ALLOWED_MODES.has(task.currentMode)) {
    errors.push(`${task.path}: 当前模式不在允许列表内。`);
  }

  const snapshot = getTaskGitSnapshot(task);

  if (task.status !== "done" && !snapshot.branch) {
    errors.push(`${task.path}: 非 done 任务必须填写分支。`);
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
    !allowsPlannedBranch(task, snapshot)
  ) {
    errors.push(`${task.path}: 已绑定分支，但无法解析最近提交。`);
  }

  if (task.status === "done" && !snapshot.mergedToMain) {
    errors.push(`${task.path}: 任务标记为 done，但最近提交尚未并入 main。`);
  }

  if (task.status !== "done" && snapshot.mergedToMain) {
    errors.push(`${task.path}: 分支提交已并入 main，但任务状态仍不是 done。`);
  }
}

function main() {
  const taskFiles = listTaskFiles();
  const errors = [];
  const snapshots = taskFiles.map((taskPath) => {
    const task = parseTask(taskPath);
    validateTask(task, errors);
    const snapshot = getTaskGitSnapshot(task);
    return {
      path: task.path,
      status: task.status,
      current_mode: task.currentMode,
      branch: snapshot.branch,
      merged_to_main: snapshot.mergedToMain,
      has_local_branch: snapshot.hasLocalBranch,
      effective_commit: snapshot.effectiveCommit ? git(["rev-parse", "--short", snapshot.effectiveCommit]).output : "",
    };
  });

  const ok = errors.length === 0;
  const payload = { ok, tasks: snapshots, errors };
  console.log(JSON.stringify(payload, null, 2));
  if (!ok) {
    process.exit(1);
  }
}

main();
