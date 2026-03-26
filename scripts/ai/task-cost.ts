const { emitResult, exitWithError, parseCliArgs } = require("./lib/cli-kernel.js");
const { buildTaskCostReport, formatTaskCostReportText } = require("./lib/task-cost-core.ts");

const cli = parseCliArgs(process.argv.slice(2));
const taskId = cli.flags.taskId || cli.flags["task-id"] || cli.positionals[0] || null;

if (!taskId) {
  exitWithError("taskId required. Use --taskId=t-xxx", cli);
}

const report = buildTaskCostReport(process.cwd(), { taskId });
emitResult(report, cli, (payload) => formatTaskCostReportText(payload));
