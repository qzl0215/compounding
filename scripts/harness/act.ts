#!/usr/bin/env node

const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { recordHarnessRuntime, syncHarnessSnapshot, workspaceRoot } = require("./lib.ts");

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=");
    args[key] = value !== undefined ? value : true;
  }
  return args;
}

function canonicalTaskRef(args, snapshot) {
  return args.taskId || snapshot?.active_contract?.short_id || snapshot?.active_contract?.task_id || null;
}

function runNode(scriptPath, extraArgs = []) {
  return spawnSync("node", ["--experimental-strip-types", scriptPath, ...extraArgs], {
    cwd: workspaceRoot(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
    },
  });
}

function printAndExit(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.exit(result.status || 0);
}

const args = parseArgs();
const actionId = String(args.action || "").trim();
const snapshot = syncHarnessSnapshot();
const nextAction = snapshot?.next_action?.action_id || null;
const taskRef = canonicalTaskRef(args, snapshot);

if (!actionId) {
  console.error(JSON.stringify({ ok: false, message: "Missing --action=<id>." }));
  process.exit(1);
}

if (!args.force && nextAction && nextAction !== actionId) {
  console.error(
    JSON.stringify({
      ok: false,
      message: `Requested action ${actionId} does not match next legal action ${nextAction}.`,
      next_action: snapshot.next_action,
    }),
  );
  process.exit(1);
}

if (actionId === "materialize_contract") {
  console.error(JSON.stringify({ ok: false, message: "Use `pnpm harness:intent:create` to materialize a new contract." }));
  process.exit(1);
}

if (actionId === "clean_workspace") {
  console.log(JSON.stringify({ ok: false, message: "当前需要先清理工作区或处理锁冲突，再继续自动动作。", snapshot }, null, 2));
  process.exit(1);
}

if (actionId === "run_preflight" || actionId === "start_execution") {
  printAndExit(runNode(path.join(workspaceRoot(), "scripts", "coord", "preflight.ts"), taskRef ? [`--taskId=${taskRef}`] : []));
}

if (actionId === "create_handoff") {
  const extraArgs = ["handoff", ...(taskRef ? [`--taskId=${taskRef}`] : [])];
  printAndExit(runNode(path.join(workspaceRoot(), "scripts", "coord", "task.ts"), extraArgs));
}

if (actionId === "run_review" || actionId === "complete_direct_merge") {
  printAndExit(runNode(path.join(workspaceRoot(), "scripts", "coord", "review.ts"), taskRef ? [`--taskId=${taskRef}`] : []));
}

if (actionId === "prepare_release") {
  const contract = snapshot?.active_contract;
  if (!contract) {
    console.error(JSON.stringify({ ok: false, message: "当前没有 active contract。" }));
    process.exit(1);
  }
  const channel = contract.delivery_track === "preview_release" ? "dev" : "prod";
  printAndExit(
    runNode(path.join(workspaceRoot(), "scripts", "release", "prepare-release.ts"), [
      "--ref=HEAD",
      `--channel=${channel}`,
      `--primary-task=${contract.task_id}`,
    ]),
  );
}

if (actionId === "accept_release") {
  const releaseId = args.release || snapshot?.state?.runtime_alignment?.target_release_id || null;
  const extraArgs = releaseId ? [`--release=${releaseId}`] : [];
  printAndExit(runNode(path.join(workspaceRoot(), "scripts", "release", "accept-dev-release.ts"), extraArgs));
}

if (actionId === "observe_runtime") {
  const prod = runNode(path.join(workspaceRoot(), "scripts", "local-runtime", "status-prod.ts"));
  const dev = runNode(path.join(workspaceRoot(), "scripts", "local-runtime", "status-preview.ts"));
  if (prod.status === 0) {
    try {
      recordHarnessRuntime("prod", JSON.parse(prod.stdout), "harness:act");
    } catch {}
  }
  if (dev.status === 0) {
    try {
      recordHarnessRuntime("dev", JSON.parse(dev.stdout), "harness:act");
    } catch {}
  }
  console.log(JSON.stringify({ ok: true, snapshot: syncHarnessSnapshot() }, null, 2));
  process.exit(0);
}

console.error(JSON.stringify({ ok: false, message: `Unsupported action: ${actionId}` }));
process.exit(1);
