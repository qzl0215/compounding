import { describe, expect, it } from "vitest";
import { getProjectCockpit } from "../service";

describe("project cockpit", () => {
  it("surfaces the unified cockpit snapshot from markdown sources and runtime state", async () => {
    const overview = await getProjectCockpit();

    expect(overview.identity.oneLiner).toContain("AI-Native Repo");
    expect(overview.identity.mission).toContain("AI-Native Repo");
    expect(overview.currentFocus.currentPhase).toContain("多 Agent 协作系统");
    expect(overview.currentFocus.currentPriority).toContain("Phase 0~3 已落地");
    expect(overview.currentFocus.currentMilestone).toContain("Autonomous Multi-Agent Coordination Layer");
    expect(overview.currentFocus.successCriteria.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(overview.executionStatus.doingTasks)).toBe(true);
    expect(overview.executionStatus.nextCheckpoint.length).toBeGreaterThan(0);
    expect(overview.executionStatus.runtimeSignals).toHaveLength(2);
    expect(overview.executionStatus.runtimeSignals.some((signal) => signal.label === "production")).toBe(true);
    expect(overview.riskBoard.factConflicts.length).toBeGreaterThanOrEqual(1);
    expect(overview.riskBoard.factConflicts.some((item) => item.includes("当前优先级"))).toBe(true);
    expect(overview.riskBoard.items.some((item) => item.title === "待验收版本")).toBe(true);
    expect(overview.riskBoard.items.some((item) => item.summary.includes("发布页"))).toBe(true);
    expect(overview.evidenceLinks.map((group) => group.title)).toEqual(["主源文档", "详情工作台", "辅助理解"]);
    expect(overview.evidenceLinks.flatMap((group) => group.items).some((item) => item.title === "AGENTS")).toBe(true);
    expect(overview.evidenceLinks.flatMap((group) => group.items).some((item) => item.title === "发布详情")).toBe(true);
  });
});
