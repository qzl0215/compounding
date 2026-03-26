const { emitResult, parseCliArgs } = require("./lib/cli-kernel.js");
const { collectPassthroughArgs, runSummaryHarness } = require("./lib/summary-harness.ts");

const cli = parseCliArgs(process.argv.slice(2));
const passthroughArgs = collectPassthroughArgs(process.argv.slice(2));

const rawCommand =
  passthroughArgs.length > 0 ? `pnpm coord:review:run -- ${passthroughArgs.join(" ")}` : "pnpm coord:review:run";

const result = runSummaryHarness({
  profileId: "review_summary",
  root: process.cwd(),
  cliFlags: cli.flags,
  agentSurface: cli.flags.agentSurface || cli.flags["agent-surface"],
  passthroughArgs,
  command: {
    cmd: "node",
    args: ["--experimental-strip-types", "scripts/coord/review.ts"],
    original_cmd: rawCommand,
    enableShortcutOpportunity: true,
  },
});

emitResult(result.payload, cli, (payload) => payload.display_text);
process.exit(result.exitCode);
