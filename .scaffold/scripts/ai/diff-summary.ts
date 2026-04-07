const { emitResult, parseCliArgs } = require("./lib/cli-kernel.js");
const { collectPassthroughArgs, runSummaryHarness } = require("./lib/summary-harness.ts");

const cli = parseCliArgs(process.argv.slice(2));
const passthroughArgs = collectPassthroughArgs(process.argv.slice(2));
const rawCommand = passthroughArgs.length ? `git diff ${passthroughArgs.join(" ")}` : "git diff HEAD";

const result = runSummaryHarness({
  profileId: "diff_summary",
  root: process.cwd(),
  cliFlags: cli.flags,
  agentSurface: cli.flags.agentSurface || cli.flags["agent-surface"],
  passthroughArgs,
  command: {
    cmd: "git",
    args: passthroughArgs.length ? ["diff"] : ["diff", "HEAD"],
    original_cmd: rawCommand,
  },
});

emitResult(result.payload, cli, (payload) => payload.display_text);
process.exit(result.exitCode);
