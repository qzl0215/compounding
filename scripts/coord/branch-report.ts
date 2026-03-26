#!/usr/bin/env node

const { buildBranchCleanupReport } = require("./lib/branch-cleanup.ts");

function parseArgs() {
  const args = { json: false, taskId: null };
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (arg === "--json") args.json = true;
    else if (arg.startsWith("--taskId=")) args.taskId = arg.slice("--taskId=".length);
  }
  return args;
}

function main() {
  const args = parseArgs();
  const payload = buildBranchCleanupReport({
    taskId: args.taskId,
  });
  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(
    `分支回收概览：scheduled ${payload.summary.scheduled} / overdue ${payload.summary.overdue} / failed ${payload.summary.failed} / legacy ${payload.summary.legacy_backlog}`,
  );
  for (const task of payload.tasks) {
    const summary = task.branch_cleanup_view?.summary || "尚未建立分支回收记录。";
    console.log(`- ${task.short_id} ${task.title}: ${summary}`);
  }
}

main();

