#!/usr/bin/env node

const { backfillBranchCleanup } = require("./lib/branch-cleanup.ts");

function parseArgs() {
  const args = { apply: false, json: false, taskId: null };
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg === "--apply") args.apply = true;
    else if (arg === "--json") args.json = true;
    else if (arg.startsWith("--taskId=")) args.taskId = arg.slice("--taskId=".length);
  }
  return args;
}

function main() {
  const args = parseArgs();
  const payload = backfillBranchCleanup({
    apply: args.apply,
    taskId: args.taskId,
  });
  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
    if (!payload.ok) {
      process.exit(1);
    }
    return;
  }
  console.log(`历史补账候选 ${payload.summary.candidates} 项，已写入 ${payload.summary.applied} 项，失败 ${payload.summary.failed} 项。`);
  for (const task of payload.tasks) {
    console.log(`- ${task.task_id}: ${task.ok ? (task.applied ? "已写入" : "待写入") : task.error || "失败"}`);
  }
  if (!payload.ok) {
    process.exit(1);
  }
}

main();
