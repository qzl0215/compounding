import { describe, expect, it } from "vitest";
import { buildGenerationPreview } from "../preview";
import type { ProjectBrief } from "../types";

const brief: ProjectBrief = {
  project_name: "Compounding",
  project_one_liner: "AI OS bootstrap",
  success_definition: "Users can initialize quickly.",
  current_priority: "Ship the task workbench.",
  must_protect: ["Git truth"],
  runtime_boundary: "server-only"
};

describe("buildGenerationPreview", () => {
  it("returns the new light-kernel core docs and capabilities", () => {
    const preview = buildGenerationPreview(brief);
    expect(preview.docs).toEqual([
      "docs/PROJECT_CARD.md",
      "docs/OPERATING_RULES.md",
      "docs/ORG_MODEL.md",
      "docs/PLAYBOOK.md",
      "docs/MEMORY_LEDGER.md"
    ]);
    expect(preview.modules).toContain("轻量项目初始化");
    expect(preview.modules).toContain("运行边界：server-only");
  });
});
