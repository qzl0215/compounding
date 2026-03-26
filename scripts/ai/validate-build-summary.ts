const { emitResult, parseCliArgs } = require("./lib/cli-kernel.js");
const { collectPassthroughArgs, runSummaryHarness } = require("./lib/summary-harness.ts");

const cli = parseCliArgs(process.argv.slice(2));
const passthroughArgs = collectPassthroughArgs(process.argv.slice(2));

const result = runSummaryHarness({
  profileId: "validate_build_summary",
  root: process.cwd(),
  cliFlags: cli.flags,
  agentSurface: cli.flags.agentSurface || cli.flags["agent-surface"],
  passthroughArgs,
  command: {
    cmd: "pnpm",
    args: ["validate:build"],
    original_cmd: "pnpm validate:build",
  },
});

emitResult(result.payload, cli, (payload) => payload.display_text);
process.exit(result.exitCode);
