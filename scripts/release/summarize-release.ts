const { changeSummary } = require("./lib.ts");

function parseArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }
  return process.argv[index + 1] || null;
}

const from = parseArg("--from");
const to = parseArg("--to");

if (!to) {
  console.error("Usage: node --experimental-strip-types scripts/release/summarize-release.ts --to <commit> [--from <commit>]");
  process.exit(1);
}

const summary = changeSummary(from, to);
console.log(JSON.stringify({ ok: true, from, to, summary }, null, 2));
