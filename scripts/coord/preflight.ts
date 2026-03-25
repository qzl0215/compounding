#!/usr/bin/env node
/**
 * Unified preflight entrypoint.
 * Usage: node --experimental-strip-types scripts/coord/preflight.ts [--taskId=t-025]
 */

const { parseFlagArgs, runPreflightGate } = require("./lib/preflight-gate.ts");

const args = parseFlagArgs(process.argv.slice(2));
const result = runPreflightGate(args);
console.log(JSON.stringify(result.payload, null, 2));
process.exit(result.exitCode);
