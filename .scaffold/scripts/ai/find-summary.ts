const { emitResult, exitWithError, parseCliArgs } = require("./lib/cli-kernel.js");
const { runSummaryHarness } = require("./lib/summary-harness.ts");

const cli = parseCliArgs(process.argv.slice(2));
const query = typeof cli.flags.query === "string" ? cli.flags.query.trim() : "";
const searchPath = typeof cli.flags.path === "string" ? cli.flags.path.trim() : ".";
const glob = typeof cli.flags.glob === "string" ? cli.flags.glob.trim() : "";

if (!query) {
  exitWithError("Missing --query for find summary.", cli, "Usage: pnpm ai:find:summary -- --query=<text> [--path=<dir>] [--glob=<pattern>]");
}

const args = ["-n", "--hidden", "--glob", "!.git", "--glob", "!node_modules", "--glob", "!.next"];
if (glob) {
  args.push("--glob", glob);
}
args.push(query, searchPath);

const originalCmd = ["rg", "-n", "--hidden", glob ? `--glob ${glob}` : "", query, searchPath].filter(Boolean).join(" ");

const result = runSummaryHarness({
  profileId: "find_summary",
  root: process.cwd(),
  cliFlags: cli.flags,
  passthroughArgs: [],
  agentSurface: cli.flags.agentSurface || cli.flags["agent-surface"],
  summaryArgs: {
    query,
    path: searchPath,
    glob: glob || null,
  },
  command: {
    cmd: "rg",
    args,
    original_cmd: originalCmd,
  },
});

emitResult(result.payload, cli, (payload) => payload.display_text);
process.exit(result.exitCode);
