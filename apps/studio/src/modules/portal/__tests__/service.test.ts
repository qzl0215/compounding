import { describe, expect, it } from "vitest";
import { getPortalOverview } from "../service";

describe("portal overview", () => {
  it("surfaces identity, roadmap, blueprint, org roles, and knowledge risk from markdown sources", async () => {
    const overview = await getPortalOverview();

    expect(overview.identity.oneLiner).toContain("AI-Native Repo");
    expect(overview.identity.mission).toContain("AI-Native Repo");
    expect(overview.identity.values.length).toBeGreaterThanOrEqual(3);
    expect(overview.roadmap.currentPhase).toContain("专业驾驶舱");
    expect(overview.roadmap.currentPriority).toContain("task/Git");
    expect(overview.roadmap.nextMilestone).toContain("专业的一页经营驾驶舱");
    expect(overview.blueprint.currentMilestone).toContain("专业驾驶舱");
    expect(overview.blueprint.goals.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(overview.blueprint.doingTasks)).toBe(true);
    expect(overview.blueprint.nextCheckpoint.length).toBeGreaterThan(0);
    expect(overview.org.some((group) => group.title === "决策层")).toBe(true);
    expect(overview.org.flatMap((group) => group.roles).some((role) => role.name.includes("总经办"))).toBe(true);
    expect(overview.knowledgeRisk.some((item) => item.title === "发布与风险")).toBe(true);
    expect(overview.knowledgeRisk.some((item) => item.title === "关键冻结项")).toBe(true);
  });
});
