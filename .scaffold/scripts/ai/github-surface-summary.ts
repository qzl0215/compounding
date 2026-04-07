const { formatGithubSurfaceReadiness, getGithubSurfaceReadiness } = require("../../shared/github-surface-runtime.ts");

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const payload = getGithubSurfaceReadiness(process.cwd());

if (asJson) {
  console.log(JSON.stringify(payload, null, 2));
} else {
  console.log(formatGithubSurfaceReadiness(payload));
}
