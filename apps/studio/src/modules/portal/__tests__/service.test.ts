import { describe, expect, it } from "vitest";
import { getProjectOverview } from "../service";

describe("project overview", () => {
  it("surfaces the stage-first snapshot from markdown sources and runtime state", async () => {
    const overview = await getProjectOverview();

    expect(overview.overview.oneLiner).toContain("release worktree");
    expect(overview.overview.currentPhase).toContain("Local Runtime Boundary Simplification");
    expect(overview.overview.currentMilestone).toContain("本地 production 脱离 release worktree");
    expect(overview.homepage.headline).toBe("先定问题，再定动作");
    expect(overview.homepage.primaryStats).toHaveLength(3);
    expect(overview.direction.summary.length).toBeGreaterThan(0);
    expect(overview.thinkingItems.length).toBeGreaterThan(0);
    expect(overview.planningItems.length).toBeGreaterThan(0);
    expect(overview.planningItems.every((item) => item.source === "运营蓝图")).toBe(true);
    expect(
      overview.readyItems.length +
        overview.doingItems.length +
        overview.acceptanceItems.length +
        overview.releasedItems.length
    ).toBeGreaterThan(0);
    expect(overview.runtimeFacts.nextCheckpoint.length).toBeGreaterThan(0);
    expect(overview.runtimeFacts.runtimeSignals).toHaveLength(2);
    expect(overview.runtimeFacts.runtimeSignals.some((signal) => signal.label === "production")).toBe(true);
    expect(overview.runtimeFacts.pendingDevSummary.length).toBeGreaterThan(0);
  }, 15000);
});
