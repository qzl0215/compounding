import { describe, expect, it } from "vitest";
import { getProjectCockpit } from "../service";

describe("project cockpit", () => {
  it("surfaces the unified cockpit snapshot from markdown sources and runtime state", async () => {
    const overview = await getProjectCockpit();

    expect(overview.identity.oneLiner).toContain("AI-Native Repo");
    expect(overview.identity.mission).toContain("AI-Native Repo");
    expect(overview.currentFocus.currentPhase).toContain("下一阶段待定");
    expect(overview.currentFocus.currentPriority).toContain("下一阶段主线候选");
    expect(overview.currentFocus.currentMilestone).toContain("Delivery Framework Phase 1");
    expect(overview.currentFocus.successCriteria.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(overview.executionStatus.doingTasks)).toBe(true);
    expect(overview.executionStatus.nextCheckpoint.length).toBeGreaterThan(0);
    expect(overview.executionStatus.runtimeSignals).toHaveLength(2);
    expect(overview.executionStatus.runtimeSignals.some((signal) => signal.label === "production")).toBe(true);
    expect(overview.riskBoard.factConflicts).toHaveLength(0);
    expect(overview.riskBoard.items.some((item) => item.title === "待验收版本")).toBe(true);
    expect(overview.riskBoard.pendingDevSummary).toMatch(/dev/);
  });
});
