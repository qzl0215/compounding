const { emitResult, parseCliArgs } = require("./lib/cli-kernel.js");
const { buildAndWriteContextRetroReport } = require("./lib/context-retro.ts");

const cli = parseCliArgs(process.argv.slice(2));
const report = buildAndWriteContextRetroReport(process.cwd(), {
  window: cli.flags.window,
  taskId: cli.flags.taskId || cli.flags["task-id"] || null,
});

emitResult(report, cli, (payload) => payload.markdown_path || payload.json_path || "");
