const { emitResult, parseCliArgs } = require("./lib/cli-kernel.js");
const { collectPassthroughArgs, runSummaryHarness } = require("./lib/summary-harness.ts");

const cli = parseCliArgs(process.argv.slice(2));
const passthroughArgs = collectPassthroughArgs(process.argv.slice(2));

const result = runSummaryHarness({
  profileId: "preview_summary",
  root: process.cwd(),
  cliFlags: cli.flags,
  agentSurface: cli.flags.agentSurface || cli.flags["agent-surface"],
  passthroughArgs,
  command: {
    cmd: "node",
    args: ["--experimental-strip-types", "scripts/local-runtime/check-preview.ts"],
    original_cmd: "pnpm preview:check",
    enableShortcutOpportunity: true,
  },
});

emitResult(result.payload, cli, (payload) => payload.display_text);
process.exit(result.exitCode);
