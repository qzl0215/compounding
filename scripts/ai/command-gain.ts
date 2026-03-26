const { emitResult, parseCliArgs } = require("./lib/cli-kernel.js");
const { buildCommandGainReport, formatCommandGainReportText } = require("./lib/command-gain.ts");

const cli = parseCliArgs(process.argv.slice(2));
const days = cli.flags.days;
const report = buildCommandGainReport(process.cwd(), { days });

emitResult(report, cli, (payload) => formatCommandGainReportText(payload));
