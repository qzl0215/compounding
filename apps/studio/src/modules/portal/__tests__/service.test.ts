import { describe, expect, it } from "vitest";
import { getPortalOverview } from "../service";

describe("portal overview", () => {
  it("surfaces identity, roadmap, blueprint, org roles, and knowledge risk from markdown sources", async () => {
    const overview = await getPortalOverview();

    expect(overview.identity.oneLiner).toContain("AI-Native Repo");
    expect(overview.identity.mission).toContain("AI-Native Repo");
    expect(overview.identity.values.length).toBeGreaterThanOrEqual(3);
    expect(overview.roadmap.currentPhase).toContain("dev 预览与验收发布链");
    expect(overview.roadmap.currentPriority).toContain("先 task、后 dev 预览");
    expect(overview.roadmap.nextMilestone).toContain("dev 预览");
    expect(overview.blueprint.currentMilestone).toContain("dev 预览与验收发布链");
    expect(overview.blueprint.goals.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(overview.blueprint.doingTasks)).toBe(true);
    expect(overview.blueprint.nextCheckpoint.length).toBeGreaterThan(0);
    expect(overview.workModeFlow.length).toBe(6);
    expect(overview.workModeFlow[0]?.name).toBe("需求提出");
    expect(overview.workModeFlow.some((mode) => mode.name.includes("战略澄清"))).toBe(true);
    expect(overview.org.some((group) => group.title === "决策层")).toBe(true);
    expect(overview.org.flatMap((group) => group.roles).some((role) => role.name.includes("总经办"))).toBe(true);
    expect(overview.knowledgeRisk.some((item) => item.title === "发布与风险")).toBe(true);
    expect(overview.knowledgeRisk.some((item) => item.title === "关键冻结项")).toBe(true);
  });
});
