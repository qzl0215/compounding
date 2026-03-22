import { describe, expect, it } from "vitest";
import { getProjectOverview } from "../service";

describe("project overview", () => {
  it("surfaces the stage-first snapshot from markdown sources and runtime state", async () => {
    const overview = await getProjectOverview();

    expect(overview.overview.oneLiner).toContain("AI-Native Repo");
    expect(overview.overview.currentPhase).toContain("Stage-First");
    expect(overview.direction.summary).toContain("待思考");
    expect(overview.thinkingItems.length).toBeGreaterThan(0);
    expect(overview.planningItems.length).toBeGreaterThan(0);
    expect(overview.doingItems.length).toBeGreaterThan(0);
    expect(overview.runtimeFacts.nextCheckpoint.length).toBeGreaterThan(0);
    expect(overview.runtimeFacts.runtimeSignals).toHaveLength(2);
    expect(overview.runtimeFacts.runtimeSignals.some((signal) => signal.label === "production")).toBe(true);
    expect(overview.runtimeFacts.pendingDevSummary).toMatch(/dev/);
  }, 15000);
});
