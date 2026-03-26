const { emitResult, exitWithError, parseCliArgs } = require("./lib/cli-kernel.js");
const { buildTurnReport, formatTurnReportText } = require("./lib/turn-report.ts");

const cli = parseCliArgs(process.argv.slice(2));
const since = cli.flags.since || null;
const taskId = cli.flags.taskId || cli.flags["task-id"] || null;

if (!since) {
  exitWithError("since is required. Use --since=<iso>", cli);
}

try {
  const report = buildTurnReport(process.cwd(), { since, taskId });
  emitResult(report, cli, (payload) => formatTurnReportText(payload));
} catch (error) {
  exitWithError(
    error instanceof Error ? error.message : "Failed to build turn report.",
    cli,
    error instanceof Error ? error.stack : null,
  );
}
