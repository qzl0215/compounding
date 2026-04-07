import { describe, expect, it } from "vitest";
import { loadPromptText } from "../ai-rewrite-prompts";

describe("ai rewrite prompt registry", () => {
  it("loads prompt assets through registry ids", () => {
    expect(loadPromptText("doc-rewrite-system")).toContain("# 文档重构系统提示词");
    expect(loadPromptText("doc-rewrite-clarify")).toContain("# 文档重构补充问题提示词");
    expect(loadPromptText("doc-rewrite-execute")).toContain("# 文档重构执行提示词");
  });
});
