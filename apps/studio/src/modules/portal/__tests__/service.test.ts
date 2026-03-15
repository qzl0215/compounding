import { describe, expect, it } from "vitest";
import { getPortalOverview } from "../service";

describe("portal overview", () => {
  it("surfaces company snapshot, battle board, org roles, systems, onboarding, and risks from markdown sources", async () => {
    const overview = await getPortalOverview();

    expect(overview.company.oneLiner).toContain("AI-Native Repo");
    expect(overview.company.currentPhase).toContain("公司介绍式首页与组织架构收口");
    expect(overview.battle.currentPriority).toContain("创业团队 operating system");
    expect(overview.battle.currentFocus.some((item) => item.includes("公司介绍"))).toBe(true);
    expect(overview.battle.doingTasks.some((task) => task.path === "tasks/queue/task-001-repo-refactor.md")).toBe(true);
    expect(overview.org.some((group) => group.title === "决策层")).toBe(true);
    expect(overview.org.flatMap((group) => group.roles).some((role) => role.name.includes("总经办"))).toBe(true);
    expect(overview.systems.some((item) => item.title === "发布系统")).toBe(true);
    expect(overview.onboarding).toHaveLength(4);
    expect(overview.risks.some((item) => item.title === "技术债")).toBe(true);
  });
});
