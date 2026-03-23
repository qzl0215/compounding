const fs = require("node:fs");
const path = require("node:path");
const { getKnowledgeAssets } = require("./lib/knowledge-assets.ts");

function currentDateFor(filePath) {
  return new Date().toISOString().slice(0, 10);
}

function renderBody(root) {
  const assets = getKnowledgeAssets(root);
  const lines = [
    "# 资产维护矩阵",
    "",
    "## 当前高频资产",
    "",
  ];

  for (const asset of assets) {
    lines.push(`### ${asset.title}`, "");
    lines.push(`- 方式：\`${asset.maintenance_mode}\``);
    lines.push(`- 真相源：\`${asset.source_of_truth}\``);
    lines.push(`- 入口：\`${asset.generation_or_validation}\``);
    lines.push(`- 文件：${asset.files.map((file) => `\`${file}\``).join("、")}`);
    if (asset.boundaries.length > 0) {
      lines.push(`- 边界：${asset.boundaries.join("；")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function renderAssetMaintenanceDoc(root) {
  const outputPath = path.join(root, "docs", "ASSET_MAINTENANCE.md");
  const body = renderBody(root);
  return [
    "---",
    "title: ASSET_MAINTENANCE",
    "update_mode: generated",
    "status: active",
    `last_reviewed_at: ${currentDateFor(outputPath)}`,
    "source_of_truth: scripts/ai/generate-asset-maintenance.ts",
    "related_docs:",
    "  - docs/PROJECT_RULES.md",
    "  - docs/AI_OPERATING_MODEL.md",
    "  - docs/prompts/prompt-assets.json",
    "  - code_index/module-index.md",
    "---",
    "<!-- BEGIN MANAGED BLOCK: CANONICAL_CONTENT -->",
    body.trim(),
    "<!-- END MANAGED BLOCK: CANONICAL_CONTENT -->",
    "",
  ].join("\n");
}

function writeAssetMaintenanceDoc(root) {
  const outputPath = path.join(root, "docs", "ASSET_MAINTENANCE.md");
  fs.writeFileSync(outputPath, renderAssetMaintenanceDoc(root));
  return outputPath;
}

module.exports = {
  renderAssetMaintenanceDoc,
  writeAssetMaintenanceDoc,
};

if (require.main === module) {
  const root = process.cwd();
  const outputPath = writeAssetMaintenanceDoc(root);
  console.log(outputPath);
}
