const fs = require("node:fs");
const path = require("node:path");

function loadPromptManifest(root) {
  const manifestPath = path.join(root, "docs", "prompts", "prompt-assets.json");
  if (!fs.existsSync(manifestPath)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function getKnowledgeAssets(root) {
  const promptAssets = loadPromptManifest(root);
  return [
    {
      id: "prompt-assets",
      title: "Prompt 资产",
      maintenance_mode: "validated",
      source_of_truth: "docs/prompts/prompt-assets.json",
      generation_or_validation: "pnpm validate:ai-output",
      files: [
        "docs/prompts/prompt-assets.json",
        ...promptAssets.map((item) => `docs/prompts/${item.file}`),
      ],
      boundaries: [
        "Prompt 正文保持人工维护，运行时与校验器统一读取注册表。",
        "新增或移除 prompt 时，必须同时更新 prompt-assets.json。",
        "Prompt 变更必须支持版本回退与人工 review。",
      ],
    },
    {
      id: "code-index-assets",
      title: "索引资产",
      maintenance_mode: "generated",
      source_of_truth: "scripts/ai/generate-module-index.ts",
      generation_or_validation: "pnpm ai:generate-index",
      files: [
        "code_index/module-index.md",
        "code_index/dependency-map.md",
        "code_index/function-index.json",
      ],
      boundaries: [
        "code_index 只做导航与压缩，不承载决策、经验或当前状态。",
        "模块边界、导出入口或函数索引变化后，应重新生成索引。",
        "人工补充说明写回 ARCHITECTURE、module.md 或 task，不直接手改生成索引。",
      ],
    },
    {
      id: "governance-docs",
      title: "关键说明文档",
      maintenance_mode: "manual",
      source_of_truth: "AGENTS.md + docs/* + memory/*",
      generation_or_validation: "人工 review + task 回写",
      files: [
        "AGENTS.md",
        "docs/PROJECT_RULES.md",
        "docs/DEV_WORKFLOW.md",
        "docs/AI_OPERATING_MODEL.md",
        "memory/project/current-state.md",
      ],
      boundaries: [
        "关键说明文档保留人工维护，不把判断性内容错误生成化。",
        "结构性改动时必须通过 task、memory 与相关文档同步回写。",
        "若规则与现实冲突，先更新主源，再调整执行链路。",
      ],
    },
  ];
}

module.exports = {
  getKnowledgeAssets,
  loadPromptManifest,
};
