const fs = require("node:fs");
const path = require("node:path");

const KNOWLEDGE_FRONTMATTER_FIELDS = Object.freeze(["title", "update_mode", "status", "source_of_truth", "related_docs", "last_reviewed_at"]);

function hasBundledSourceOfTruth(value) {
  return /[+，,]/.test(String(value || ""));
}

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
      id: "kernel-contracts",
      title: "Kernel 机器合同",
      maintenance_mode: "manual",
      source_of_truth: "kernel/task-state-machine.yaml",
      generation_or_validation: "pnpm validate:static",
      files: [
        "kernel/task-state-machine.yaml",
        "kernel/derived-asset-contract.yaml",
      ],
      boundaries: [
        "kernel 下的 YAML 定义仓库级机器合同；修改后必须同步 validator、默认读链和相关 docs。",
        "任务状态机约束 task / companion 的状态流，派生产物合同约束 code_index / output / coordination / runtime 的语义。",
        "这些合同不承载业务决策，只定义仓库级机器边界与读写口径。",
      ],
    },
    {
      id: "governance-spine-docs",
      title: "高频主干文档",
      maintenance_mode: "manual",
      source_of_truth: "frontmatter.source_of_truth (per document)",
      generation_or_validation: "人工 review + task 回写",
      files: [
        "AGENTS.md",
        "docs/WORK_MODES.md",
        "docs/DEV_WORKFLOW.md",
        "docs/ARCHITECTURE.md",
        "memory/project/goals.md",
        "memory/project/current-state.md",
      ],
      freshness_policy: {
        window_days: 14,
        strict_failure: true,
      },
      metadata_policy: {
        required_frontmatter_fields: KNOWLEDGE_FRONTMATTER_FIELDS,
        validate_related_docs: true,
        validate_source_of_truth_path: true,
        require_review_bump_on_change: true,
      },
      boundaries: [
        "高频主干文档保留人工维护，不把判断性内容错误生成化。",
        "默认先读主干，再按场景补专项附录、task 和 code_index。",
        "结构性改动时必须通过 task、memory 与相关主干文档同步回写。",
      ],
    },
    {
      id: "appendix-docs",
      title: "专项附录",
      maintenance_mode: "manual",
      source_of_truth: "frontmatter.source_of_truth (per document)",
      generation_or_validation: "人工 review + task 回写",
      files: [
        "docs/PROJECT_RULES.md",
        "docs/AI_OPERATING_MODEL.md",
        "docs/ASSET_MAINTENANCE.md",
        "memory/project/tech-debt.md",
      ],
      freshness_policy: {
        window_days: 21,
        strict_failure: false,
      },
      metadata_policy: {
        required_frontmatter_fields: KNOWLEDGE_FRONTMATTER_FIELDS,
        validate_related_docs: true,
        validate_source_of_truth_path: true,
        require_review_bump_on_change: true,
      },
      boundaries: [
        "专项附录只在对应场景补读，不回到默认第一跳。",
        "附录负责专项规则、AI 行为原则和资产维护，不与主干争主入口。",
        "若附录与主干冲突，先更新主干，再调整附录。",
      ],
    },
  ];
}

module.exports = {
  KNOWLEDGE_FRONTMATTER_FIELDS,
  getKnowledgeAssets,
  hasBundledSourceOfTruth,
  loadPromptManifest,
};
