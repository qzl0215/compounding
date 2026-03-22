const fs = require("node:fs");
const path = require("node:path");
const { getKnowledgeAssets, hasBundledSourceOfTruth, loadPromptManifest } = require("./lib/knowledge-assets.ts");
const { renderAssetMaintenanceDoc } = require("./generate-asset-maintenance.ts");

const root = process.cwd();
const errors = [];
const warnings = [];
const details = {
  asset_ids: [],
  prompt_manifest_count: 0,
};

function validateAssetMaintenanceDoc() {
  const docPath = path.join(root, "docs", "ASSET_MAINTENANCE.md");
  if (!fs.existsSync(docPath)) {
    errors.push("Missing generated asset maintenance doc: docs/ASSET_MAINTENANCE.md");
    return;
  }
  const committed = fs.readFileSync(docPath, "utf8");
  const regenerated = renderAssetMaintenanceDoc(root);
  if (committed !== regenerated) {
    errors.push("docs/ASSET_MAINTENANCE.md is not in sync with scripts/ai/generate-asset-maintenance.ts");
  }
}

function validatePromptManifest() {
  const manifest = loadPromptManifest(root);
  details.prompt_manifest_count = manifest.length;
  if (!Array.isArray(manifest) || manifest.length === 0) {
    errors.push("Prompt manifest is missing or empty: docs/prompts/prompt-assets.json");
    return;
  }
  for (const asset of manifest) {
    if (!asset.id || !asset.file || !Array.isArray(asset.required_sections)) {
      errors.push(`Prompt manifest entry is incomplete: ${JSON.stringify(asset)}`);
      continue;
    }
    const filePath = path.join(root, "docs", "prompts", asset.file);
    if (!fs.existsSync(filePath)) {
      errors.push(`Prompt manifest references missing file: docs/prompts/${asset.file}`);
      continue;
    }
  }
}

for (const asset of getKnowledgeAssets(root)) {
  details.asset_ids.push(asset.id);
  if (hasBundledSourceOfTruth(asset.source_of_truth)) {
    errors.push(`Knowledge asset ${asset.id} must use a single source_of_truth owner.`);
  }
}

validatePromptManifest();
validateAssetMaintenanceDoc();

console.log(
  JSON.stringify(
    {
      ok: errors.length === 0,
      layer: "knowledge-assets",
      errors,
      warnings,
      details,
    },
    null,
    2
  )
);

if (errors.length > 0) {
  process.exit(1);
}
