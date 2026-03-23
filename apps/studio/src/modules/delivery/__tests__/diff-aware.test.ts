import { describe, expect, it } from "vitest";
import { buildDiffAwareArtifactFromFiles } from "../diff-aware";

describe("diff-aware artifact", () => {
  it("builds a compact artifact for mixed docs and source changes", () => {
    const artifact = buildDiffAwareArtifactFromFiles(
      ["apps/studio/src/app/releases/page.tsx", "docs/WORK_MODES.md"],
      { files: 2, insertions: 48, deletions: 12 }
    );

    expect(artifact.state).toBe("dirty");
    expect(artifact.changedFiles).toEqual(["apps/studio/src/app/releases/page.tsx", "docs/WORK_MODES.md"]);
    expect(artifact.suggestedChecks.map((layer) => layer.id)).toEqual(["static", "build", "runtime"]);
    expect(artifact.selectedChecks.map((layer) => layer.id)).toEqual(["static", "build", "runtime"]);
    expect(artifact.selectedChecks.every((layer) => layer.reason.length > 0)).toBe(true);
    expect(artifact.retirementSuggestions.length).toBeGreaterThan(0);
    expect(artifact.scopeSummary).toContain("2 个文件");
    expect(artifact.reviewSummary.length).toBeGreaterThan(0);
    expect(artifact.retroSummary.length).toBeGreaterThan(0);
    expect(artifact.shipLog).toHaveLength(5);
  });

  it("includes ai-output when prompt assets or ai scripts change", () => {
    const artifact = buildDiffAwareArtifactFromFiles(
      ["docs/prompts/prompt-assets.json", "scripts/ai/validate-ai-output.ts"],
      { files: 2, insertions: 10, deletions: 2 }
    );

    expect(artifact.suggestedChecks.map((layer) => layer.id)).toContain("ai-output");
    expect(artifact.evidencePoints.join(" ")).toContain("pnpm validate:ai-output");
    expect(artifact.selectedChecks.find((layer) => layer.id === "ai-output")?.reason).toContain("prompt / AI 脚本");
    expect(artifact.retirementSuggestions.join(" ")).toContain("仅在 prompt / AI 脚本变化时保留 ai-output 门禁");
  });

  it("produces a clean artifact when there is no diff", () => {
    const artifact = buildDiffAwareArtifactFromFiles([], { files: 0, insertions: 0, deletions: 0 });

    expect(artifact.state).toBe("clean");
    expect(artifact.summary).toContain("没有新的 diff");
    expect(artifact.suggestedChecks).toHaveLength(0);
    expect(artifact.nextActions).toContain("继续正常开发流程");
  });
});
