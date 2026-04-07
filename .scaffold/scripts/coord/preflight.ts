#!/usr/bin/env node
/**
 * Unified preflight entrypoint.
 * Usage: node --experimental-strip-types scripts/coord/preflight.ts [--taskId=t-025]
 */

const { parseFlagArgs, runPreflightGate } = require("./lib/preflight-gate.ts");
const { recordShortcutOpportunityFromEnv } = require("../ai/lib/command-gain.ts");

const args = parseFlagArgs(process.argv.slice(2));
const result = runPreflightGate(args);
recordShortcutOpportunityFromEnv(process.cwd(), {
  shortcutId: "preflight_summary",
  originalCmd: args.taskId ? `pnpm preflight -- --taskId=${args.taskId}` : "pnpm preflight",
  taskId: args.taskId || null,
  profileId: "preflight_summary",
  profileVersion: "1",
  exitCode: result.exitCode,
});
console.log(JSON.stringify(result.payload, null, 2));
process.exit(result.exitCode);
