import { describe, expect, it } from "vitest";
import { getProjectCockpit } from "../service";

describe("project cockpit", () => {
  it("surfaces the unified cockpit snapshot from markdown sources and runtime state", async () => {
    const overview = await getProjectCockpit();

    expect(overview.identity.oneLiner).toContain("AI-Native Repo");
    expect(overview.currentFocus.currentPhase).toContain("Phase 2");
    expect(overview.currentFocus.currentPriority).toContain("t-038");
    expect(overview.currentFocus.currentMilestone).toContain("AI 自主系统反熵收敛");
    expect(overview.currentFocus.successCriteria.length).toBeGreaterThanOrEqual(3);
    expect(overview.executionStatus.nextCheckpoint.length).toBeGreaterThan(0);
    expect(overview.executionStatus.runtimeSignals).toHaveLength(2);
    expect(overview.executionStatus.runtimeSignals.some((signal) => signal.label === "production")).toBe(true);
    expect(overview.riskBoard.pendingDevSummary).toMatch(/dev/);
  });
});
