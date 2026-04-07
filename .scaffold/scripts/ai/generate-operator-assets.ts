const fs = require("node:fs");
const path = require("node:path");
const { buildOperatorAssets, loadOperatorContract } = require("./lib/operator-contract.ts");

const ROOT = process.cwd();

function main() {
  const contract = loadOperatorContract(ROOT);
  const assets = buildOperatorAssets(ROOT, contract);
  for (const [relativePath, content] of Object.entries(assets)) {
    const absolutePath = path.join(ROOT, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, String(content), "utf8");
  }
  console.log(JSON.stringify({ ok: true, generated_paths: Object.keys(assets) }, null, 2));
}

main();
