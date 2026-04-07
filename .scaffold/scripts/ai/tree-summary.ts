const { emitResult, parseCliArgs } = require("./lib/cli-kernel.js");
const { collectPassthroughArgs, runSummaryHarness } = require("./lib/summary-harness.ts");

const cli = parseCliArgs(process.argv.slice(2));
const passthroughArgs = collectPassthroughArgs(process.argv.slice(2));
const targetPath = passthroughArgs[0] || ".";

const result = runSummaryHarness({
  profileId: "tree_summary",
  root: process.cwd(),
  cliFlags: cli.flags,
  agentSurface: cli.flags.agentSurface || cli.flags["agent-surface"],
  passthroughArgs: [targetPath],
  command: {
    cmd: "rg",
    args: ["--files", "--hidden", "-g", "!.git", "-g", "!node_modules", "-g", "!.next"],
    original_cmd: `rg --files --hidden ${targetPath}`.trim(),
  },
});

emitResult(result.payload, cli, (payload) => payload.display_text);
process.exit(result.exitCode);
