const fs = require("node:fs");
const path = require("node:path");
const { getKnowledgeAssets } = require("./lib/knowledge-assets.ts");

function currentDateFor(filePath) {
  const today = new Date().toISOString().slice(0, 10);
  if (!fs.existsSync(filePath)) {
    return today;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/last_reviewed_at:\s*(.+)/);
  return match ? match[1].trim() : today;
}

function renderBody(root) {
  const assets = getKnowledgeAssets(root);
  const lines = [
    "# 资产维护矩阵",
    "",
    "## 三分法",
    "",
    "- `generated`：由脚本生成，人不直接手改生成产物。",
    "- `validated`：正文人工维护，但运行时与校验器共用注册表或结构检查。",
    "- `manual`：保留人工维护，通过 task 回写和 review 控制质量。",
    "",
    "## 当前高频资产",
    "",
  ];

  for (const asset of assets) {
    lines.push(`### ${asset.title}`, "");
    lines.push(`- 维护方式：\`${asset.maintenance_mode}\``);
    lines.push(`- 真相源：\`${asset.source_of_truth}\``);
    lines.push(`- 入口命令：\`${asset.generation_or_validation}\``);
    lines.push("- 资产文件：");
    for (const file of asset.files) {
      lines.push(`  - \`${file}\``);
    }
    lines.push("- 边界：");
    for (const boundary of asset.boundaries) {
      lines.push(`  - ${boundary}`);
    }
    lines.push("");
  }

  lines.push("## 默认维护原则", "");
  lines.push("- 先明确真相源，再决定生成、校验或人工维护。");
  lines.push("- 生成产物不承载判断性内容；判断性内容继续留在人工主源。");
  lines.push("- 只有高频、高漂移且易校验的资产，才优先进入防漂移机制。");
  lines.push("");
  return lines.join("\n");
}

function renderAssetMaintenanceDoc(root) {
  const outputPath = path.join(root, "docs", "ASSET_MAINTENANCE.md");
  const body = renderBody(root);
  return [
    "---",
    "title: ASSET_MAINTENANCE",
    "doc_role: reference",
    "update_mode: generated",
    "owner_role: Architect",
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
