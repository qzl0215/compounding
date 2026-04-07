#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { syncTaskMaterialization, workspaceRoot } = require("./lib.ts");

const forwarded = process.argv.slice(2);
const result = spawnSync("node", ["--experimental-strip-types", path.join(workspaceRoot(), "scripts", "ai", "create-task.ts"), ...forwarded], {
  cwd: workspaceRoot(),
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || "Failed to create task.\n");
  process.exit(result.status || 1);
}

const createdPath = String(result.stdout || "").trim();
const taskId = path.basename(createdPath, ".md");
const syncResult = syncTaskMaterialization(taskId, { source: "harness:intent:create" });

console.log(
  JSON.stringify(
    {
      ok: true,
      path: createdPath,
      task_id: taskId,
      snapshot: syncResult.snapshot,
    },
    null,
    2,
  ),
);
