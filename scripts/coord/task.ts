#!/usr/bin/env node
/**
 * Task coordination: create / start / handoff / merge.
 * Usage: node --experimental-strip-types scripts/coord/task.ts <create|start|handoff|merge> [options]
 */

const { spawnSync } = require("node:child_process");
const { ensureCompanion } = require("./lib/task-meta.ts");
const { recordCreated, recordHandoff, recordSearchEvidence } = require("./lib/companion-lifecycle.ts");

const ROOT = process.cwd();

function parseArgs() {
  const cmd = process.argv[2];
  const args = {};
  for (let i = 3; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      args[key] = val !== undefined ? val : true;
    }
  }
  return { cmd, args };
}

function create(args) {
  const taskId = args.taskId;
  const summary = args.summary || args.goal;
  const why = args.why;
  if (!taskId || !summary || !why) {
    console.error(
      JSON.stringify({ ok: false, error: "taskId, summary, why required. Use --taskId=... --summary=... --why=..." })
    );
    process.exit(1);
  }
  const id = taskId.startsWith("task-") ? taskId : `task-${taskId.replace(/^t-/, "")}`;
  const result = spawnSync(
    "node",
    ["--experimental-strip-types", "scripts/ai/create-task.ts", id, summary, why, ...buildCreateTaskFlags(args)],
    {
      cwd: ROOT,
      encoding: "utf8",
    }
  );
  if (result.status !== 0) {
    console.error(JSON.stringify({ ok: false, error: result.stderr || result.stdout }));
    process.exit(1);
  }
  const outPath = (result.stdout || "").trim();
  const companionResult = ensureCompanion(id);
  if (!companionResult.ok) {
    console.error(JSON.stringify({ ok: false, error: companionResult.error }));
    process.exit(1);
  }
  recordCreated(id, { source: "coord:task:create" });
  console.log(JSON.stringify({ ok: true, task_file: outPath, companion_path: require("./lib/task-meta.ts").getCompanionPath(id) }));
}

function buildCreateTaskFlags(args) {
  const flagMap = {
    parentPlan: "parentPlan",
    boundary: "boundary",
    doneWhen: "doneWhen",
    inScope: "inScope",
    outOfScope: "outOfScope",
    constraints: "constraints",
    risk: "risk",
    testReason: "testReason",
    testScope: "testScope",
    testSkip: "testSkip",
    testRoi: "testRoi",
    status: "status",
    acceptanceResult: "acceptanceResult",
    deliveryResult: "deliveryResult",
    retro: "retro",
  };

  return Object.entries(flagMap)
    .filter(([argKey]) => typeof args[argKey] === "string" && String(args[argKey]).trim() !== "")
    .map(([argKey, flagName]) => `--${flagName}=${args[argKey]}`);
}

function start(args) {
  const taskId = args.taskId;
  if (!taskId) {
    console.error(JSON.stringify({ ok: false, error: "taskId required. Use --taskId=t-025" }));
    process.exit(1);
  }
  const result = spawnSync("node", ["--experimental-strip-types", "scripts/coord/check.ts", "pre-task", `--taskId=${taskId}`], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const out = result.stdout || "";
  if (result.status !== 0) {
    console.error(out || result.stderr);
    process.exit(1);
  }
  console.log(out);
}

function handoff(args) {
  const taskId = args.taskId;
  if (!taskId) {
    console.error(JSON.stringify({ ok: false, error: "taskId required" }));
    process.exit(1);
  }
  const comp = ensureCompanion(taskId);
  if (!comp.ok) {
    console.error(JSON.stringify({ ok: false, error: comp.error }));
    process.exit(1);
  }
  const branchName = spawnSync("git", ["branch", "--show-current"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  const gitHead = spawnSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  const recorded = recordHandoff(taskId, {
    source: "coord:task:handoff",
    branch_name: branchName || comp.companion.branch_name,
    git_head: gitHead || null,
  });
  console.log(
    JSON.stringify({
      ok: true,
      message: "Task handoff ready. Run coord:review:run to validate.",
      companion: recorded.ok ? recorded.companion : comp.companion,
    })
  );
}

function search(args) {
  const taskId = args.taskId;
  const conclusion = String(args.conclusion || "").trim();
  const sources = String(args.sources || "")
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!taskId || !conclusion) {
    console.error(JSON.stringify({ ok: false, error: "taskId and conclusion required. Use --taskId=t-044 --sources=repo|docs --conclusion=..." }));
    process.exit(1);
  }
  const comp = ensureCompanion(taskId);
  if (!comp.ok) {
    console.error(JSON.stringify({ ok: false, error: comp.error }));
    process.exit(1);
  }
  const recorded = recordSearchEvidence(taskId, {
    source: "coord:task:search",
    scope: args.scope || "unfamiliar_pattern",
    sources,
    conclusion,
  });
  console.log(
    JSON.stringify({
      ok: true,
      task_id: taskId,
      search_evidence: recorded.ok ? recorded.companion.artifacts?.search_evidence?.slice(-1)[0] || null : null,
      message: "Search evidence recorded.",
    })
  );
}

function merge(args) {
  const taskId = args.taskId;
  if (!taskId) {
    console.error(JSON.stringify({ ok: false, error: "taskId required" }));
    process.exit(1);
  }
  const result = spawnSync("node", ["--experimental-strip-types", "scripts/coord/review.ts", `--taskId=${taskId}`], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = result.stdout || "";
  if (stdout) {
    console.log(stdout.trim());
  } else if (result.stderr) {
    console.error(result.stderr.trim());
  }
  process.exit(result.status || 0);
}

const { cmd, args } = parseArgs();

if (cmd === "create") create(args);
else if (cmd === "start") start(args);
else if (cmd === "handoff") handoff(args);
else if (cmd === "search") search(args);
else if (cmd === "merge") merge(args);
else {
  console.error(
    JSON.stringify({
      ok: false,
      error:
        "Usage: task.ts create|start|search|handoff|merge [--taskId=...] [--summary=...] [--why=...] [--boundary=...] [--doneWhen=...] ...",
    })
  );
  process.exit(1);
}
