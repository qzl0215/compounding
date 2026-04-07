#!/usr/bin/env node

const { runBranchCleanup } = require("./lib/branch-cleanup.ts");

function parseArgs() {
  const args = { dueOnly: true, dryRun: false, json: false, taskId: null };
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--json") args.json = true;
    else if (arg === "--all") args.dueOnly = false;
    else if (arg === "--due-only") args.dueOnly = true;
    else if (arg.startsWith("--taskId=")) args.taskId = arg.slice("--taskId=".length);
  }
  return args;
}

function main() {
  const args = parseArgs();
  const payload = runBranchCleanup({
    dueOnly: args.dueOnly,
    dryRun: args.dryRun,
    taskId: args.taskId,
  });
  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
    if (!payload.ok) {
      process.exit(1);
    }
    return;
  }
  console.log(
    `分支回收执行：attempted ${payload.summary.attempted} / deleted ${payload.summary.deleted} / failed ${payload.summary.failed} / canceled ${payload.summary.canceled}`,
  );
  for (const task of payload.tasks) {
    console.log(`- ${task.task_id}: ${task.ok ? (task.canceled ? "已取消" : task.branch_cleanup?.overall_state || "已处理") : task.error || "失败"}`);
  }
  if (!payload.ok) {
    process.exit(1);
  }
}

main();
