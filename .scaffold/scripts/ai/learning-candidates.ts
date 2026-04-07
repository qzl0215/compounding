const { emitResult, parseCliArgs } = require("./lib/cli-kernel.js");
const { buildAndWriteLearningCandidatesReport } = require("./lib/learning-candidates.ts");

const cli = parseCliArgs(process.argv.slice(2));
const report = buildAndWriteLearningCandidatesReport(process.cwd(), {
  window: cli.flags.window,
  taskId: cli.flags.taskId || cli.flags["task-id"] || null,
});

emitResult(report, cli, (payload) => payload.markdown_path || payload.json_path || "");
