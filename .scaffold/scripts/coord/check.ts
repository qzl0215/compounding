#!/usr/bin/env node
/**
 * Compatibility shell for the legacy pre-task entrypoint.
 * Usage: node --experimental-strip-types scripts/coord/check.ts pre-task [--taskId=t-025]
 */

const { parseFlagArgs, runPreflightGate } = require("./lib/preflight-gate.ts");

function parseArgs() {
  const cmd = process.argv[2];
  return { cmd, args: parseFlagArgs(process.argv.slice(3)) };
}

const { cmd, args } = parseArgs();

if (cmd === "pre-task") {
  const result = runPreflightGate(args, { requireTaskId: true });
  console.log(JSON.stringify(result.payload, null, 2));
  process.exit(result.exitCode);
} else {
  console.error(JSON.stringify({ ok: false, error: "Usage: check.ts pre-task --taskId=t-025" }));
  process.exit(1);
}
