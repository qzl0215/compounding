const path = require("node:path");
const { emitResult, exitWithError, parseCliArgs } = require("./lib/cli-kernel.js");
const { runSummaryHarness } = require("./lib/summary-harness.ts");

const cli = parseCliArgs(process.argv.slice(2));
const inputPath = typeof cli.flags.path === "string" ? cli.flags.path.trim() : "";

if (!inputPath) {
  exitWithError("Missing --path for read summary.", cli, "Usage: pnpm ai:read:summary -- --path=<file>");
}

const root = process.cwd();
const absolutePath = path.resolve(root, inputPath);
const relativePath = path.relative(root, absolutePath).replace(/\\/g, "/");
if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
  exitWithError("read_summary only supports repo-local files.", cli, `Rejected path: ${inputPath}`);
}

const result = runSummaryHarness({
  profileId: "read_summary",
  root,
  cliFlags: cli.flags,
  passthroughArgs: [],
  agentSurface: cli.flags.agentSurface || cli.flags["agent-surface"],
  summaryArgs: {
    path: relativePath,
  },
  command: {
    cmd: "cat",
    args: [relativePath],
    original_cmd: `cat ${relativePath}`,
  },
});

emitResult(result.payload, cli, (payload) => payload.display_text);
process.exit(result.exitCode);
