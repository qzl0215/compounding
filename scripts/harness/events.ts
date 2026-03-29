#!/usr/bin/env node

const { readHarnessEvents } = require("./lib.ts");

function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i += 1) {
    const arg = process.argv[i];
    if (!arg.startsWith("--")) continue;
    const [key, value] = arg.slice(2).split("=");
    args[key] = value !== undefined ? value : true;
  }
  return args;
}

const args = parseArgs();
const events = readHarnessEvents({ limit: args.limit || null });
console.log(JSON.stringify({ ok: true, count: events.length, events }, null, 2));
