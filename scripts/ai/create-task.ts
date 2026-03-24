const fs = require("node:fs");
const path = require("node:path");
const { listTaskRecords } = require("./lib/task-resolver.ts");
const { ensureCompanion } = require("../coord/lib/task-meta.ts");
const { emitResult, exitWithError, parseCliArgs, renderTaskTemplate } = require("./lib/cli-kernel.js");

const cli = parseCliArgs(process.argv.slice(2));
const [taskId, summary, whyNow] = cli.positionals.slice(0, 3);
const argv = cli.flags;
if (!taskId || !summary || !whyNow) {
  exitWithError(
    "Missing required arguments for create-task.",
    cli,
    [
      "Usage: node --experimental-strip-types scripts/ai/create-task.ts <task-id> <summary> <why-now>",
      "Optional flags: --parentPlan=... --boundary=... --doneWhen=... --inScope=... --outOfScope=... --constraints=...",
      "                --risk=... --testReason=... --testScope=... --testSkip=... --testRoi=... --status=...",
      "                --acceptanceResult=... --deliveryResult=... --retro=... --currentMode=... --branch=...",
      "                --relatedModules='- `path/file`\\n- `dir/`' --updateTraceMemory=... --updateTraceIndex=...",
      "                --updateTraceRoadmap=... --updateTraceDocs=...",
    ].join("\n")
  );
}

const root = process.cwd();
const outputPath = path.join(root, "tasks", "queue", `${taskId}.md`);
const shortIdMatch = taskId.match(/^task-(\d+)/);
const shortId = shortIdMatch ? `t-${shortIdMatch[1]}` : `t-${taskId}`;
const existingTaskRecords = listTaskRecords(root);
if (existingTaskRecords.some((record) => record.id === taskId || record.path === path.posix.join("tasks/queue", `${taskId}.md`))) {
  exitWithError(`Task already exists: ${taskId}`, cli);
}
if (existingTaskRecords.some((record) => record.shortId === shortId)) {
  exitWithError(`Short task id already exists: ${shortId}`, cli);
}

const body = renderTaskTemplate(
  {
    task_id: taskId,
    short_id: shortId,
    parent_plan: argv.parentPlan || argv.parent_plan,
    summary: argv.summary || summary,
    why_now: argv.whyNow || argv.why_now || whyNow,
    boundary: argv.boundary,
    done_when: argv.doneWhen || argv.done_when,
    in_scope: argv.inScope || argv.in_scope,
    out_of_scope: argv.outOfScope || argv.out_of_scope,
    constraints: argv.constraints,
    risk: argv.risk,
    test_reason: argv.testReason || argv.test_reason,
    test_scope: argv.testScope || argv.test_scope,
    test_skip: argv.testSkip || argv.test_skip,
    test_roi: argv.testRoi || argv.test_roi,
    status: argv.status,
    acceptance_result: argv.acceptanceResult || argv.acceptance_result,
    delivery_result: argv.deliveryResult || argv.delivery_result,
    retro: argv.retro,
    current_mode: argv.currentMode || argv.current_mode || "工程执行",
    branch: argv.branch || `codex/${taskId}`,
    related_modules: argv.relatedModules || argv.related_modules || "",
    update_trace_memory: argv.updateTraceMemory || argv.update_trace_memory || "no change: 未更新",
    update_trace_index: argv.updateTraceIndex || argv.update_trace_index || "no change: 未更新",
    update_trace_roadmap: argv.updateTraceRoadmap || argv.update_trace_roadmap || "no change: 未更新",
    update_trace_docs: argv.updateTraceDocs || argv.update_trace_docs || "no change: 未更新",
  },
  root
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, body);
ensureCompanion(taskId);
emitResult(
  {
    ok: true,
    task_id: taskId,
    short_id: shortId,
    path: outputPath,
  },
  cli,
  (result) => result.path
);
