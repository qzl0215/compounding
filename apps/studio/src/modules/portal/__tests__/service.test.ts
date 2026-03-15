import { describe, expect, it } from "vitest";
import { getPortalOverview } from "../service";

describe("portal overview", () => {
  it("surfaces identity, roadmap, blueprint, org roles, and knowledge risk from markdown sources", async () => {
    const overview = await getPortalOverview();

    expect(overview.identity.oneLiner).toContain("AI-Native Repo");
    expect(overview.identity.mission).toContain("AI-Native Repo");
    expect(overview.identity.values.length).toBeGreaterThanOrEqual(3);
    expect(overview.roadmap.currentPhase).toContain("经营驾驶舱首页与认知分层收口");
    expect(overview.roadmap.currentPriority).toContain("经营驾驶舱");
    expect(overview.roadmap.nextMilestone).toContain("经营驾驶舱");
    expect(overview.blueprint.currentMilestone).toContain("经营驾驶舱");
    expect(overview.blueprint.goals.length).toBeGreaterThanOrEqual(3);
    expect(overview.blueprint.doingTasks.length).toBeGreaterThan(0);
    expect(overview.blueprint.doingTasks.some((task) => task.status === "进行中")).toBe(true);
    expect(overview.org.some((group) => group.title === "决策层")).toBe(true);
    expect(overview.org.flatMap((group) => group.roles).some((role) => role.name.includes("总经办"))).toBe(true);
    expect(overview.knowledgeRisk.some((item) => item.title === "发布与风险")).toBe(true);
    expect(overview.knowledgeRisk.some((item) => item.title === "关键冻结项")).toBe(true);
  });
});
