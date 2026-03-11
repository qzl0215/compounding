import type { ProjectBrief } from "./types";

const coreDocs = [
  "docs/PROJECT_CARD.md",
  "docs/OPERATING_RULES.md",
  "docs/ORG_MODEL.md",
  "docs/PLAYBOOK.md",
  "docs/MEMORY_LEDGER.md"
];

export function buildGenerationPreview(brief: ProjectBrief) {
  return {
    docs: coreDocs,
    modules: [
      "轻量项目初始化",
      "Agent task brief 自动拼装",
      "摘要审批 + block-level apply guard",
      `运行边界：${brief.runtime_boundary}`
    ]
  };
}
