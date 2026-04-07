const { collectKnowledgeAssetHealth } = require("./lib/knowledge-asset-health.ts");

const payload = collectKnowledgeAssetHealth(process.cwd(), { strict: process.argv.includes("--strict") });

console.log(JSON.stringify(payload, null, 2));

if (!payload.ok) {
  process.exit(1);
}
