const path = require("node:path");
const childProcess = require("node:child_process");
const { attachChangePacketAliases, buildChangePacket } = require("./lib/change-policy.ts");
const { parseTaskContract } = require(path.join(process.cwd(), "shared", "task-contract.ts"));

const root = process.cwd();

function git(args) {
  return childProcess.execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function currentBranch() {
  return git(["branch", "--show-current"]);
}

function readTask(taskPath) {
  const fs = require("node:fs");
  return parseTaskContract(taskPath, fs.readFileSync(path.join(root, taskPath), "utf8"));
}

function branchTaskId(branch) {
  const normalized = String(branch || "").trim();
  const match = normalized.match(/^codex\/(task-\d+)(?:$|[-/].*)/);
  return match ? match[1] : "";
}

function matchesTaskBranch(taskPath, branchTask) {
  if (!branchTask) return false;
  const baseName = path.basename(String(taskPath || "").trim(), ".md");
  return baseName === branchTask || baseName.startsWith(`${branchTask}-`);
}

function validateTask(taskPath, errors, options = {}) {
  const task = readTask(taskPath);
  const strictPlaceholders = Boolean(options.strictPlaceholders);
  const requiredFields = [
    ["短编号", task.shortId],
    ["父计划", task.parentPlan],
    ["任务摘要", task.summary],
    ["为什么现在", task.whyNow],
    ["承接边界", task.boundary],
    ["完成定义", task.doneWhen],
    ["要做", task.inScope],
    ["不做", task.outOfScope],
    ["关键风险", task.risk],
    ["测试策略", task.testStrategy],
    ["状态", task.status],
  ];

  for (const [label, value] of requiredFields) {
    if (!String(value || "").trim()) {
      errors.push(`${taskPath}: 缺少必填字段“${label}”。`);
    }
    if (strictPlaceholders && isPlaceholderValue(value)) {
      errors.push(`${taskPath}: 字段“${label}”仍是待补充占位内容。`);
    }
  }
}

function isPlaceholderValue(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return false;
  }
  return /^(待补充|未记录|未交付|未复盘|待验收)([:：。]|$)/.test(normalized);
}

function main() {
  const changePacket = buildChangePacket(root, { mode: "recent" });
  const changedFiles = changePacket.changed_files;
  if (changedFiles.length === 0) {
    console.log(
      JSON.stringify(
        attachChangePacketAliases({
          ok: true,
          message: "No repo-tracked changes to validate.",
          changed_files: [],
        }, changePacket),
        null,
        2
      )
    );
    return;
  }

  const changedTaskFiles = changedFiles.filter((file) => file.startsWith("tasks/queue/") && file.endsWith(".md"));
  const errors = [];
  const activeBranch = currentBranch();

  if (changePacket.policy.requires_task && changedTaskFiles.length === 0) {
    errors.push("存在 repo-tracked 改动，但没有任何 tasks/queue/*.md 变更。");
  }

  const strictPlaceholders = changePacket.policy.requires_task || activeBranch.startsWith("codex/");
  changedTaskFiles.forEach((taskPath) => validateTask(taskPath, errors, { strictPlaceholders }));

  if (changePacket.policy.strict_task_binding && activeBranch.startsWith("codex/") && changedTaskFiles.length > 0) {
    const activeTaskId = branchTaskId(activeBranch);
    const matchesBranchTask = changedTaskFiles.some((taskPath) => matchesTaskBranch(taskPath, activeTaskId));
    if (!matchesBranchTask) {
      errors.push(`当前分支 ${activeBranch} 有代码改动，但本次变更的 task 中没有与分支同名的执行 task。`);
    }
  }

  const ok = errors.length === 0;
  const payload = attachChangePacketAliases({
    ok,
    changed_tasks: changedTaskFiles,
    errors,
  }, changePacket);

  console.log(JSON.stringify(payload, null, 2));
  if (!ok) {
    process.exit(1);
  }
}

main();
