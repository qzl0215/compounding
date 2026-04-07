import { describe, expect, it } from "vitest";
import { buildHomeLogicMapSnapshot } from "../builders";
import { getHomeStatusBoard } from "../service";

const SERVICE_TIMEOUT_MS = 30000;

describe("home status board service", () => {
  it("builds a human-friendly home logic snapshot from project sources", async () => {
    const snapshot = await getHomeStatusBoard();

    expect(snapshot.identity.name).toContain("Compounding");
    expect(snapshot.logicMap.nodes.map((node) => node.id)).toEqual(["focus", "goals", "plan", "execution", "acceptance"]);
    expect(snapshot.logicMap.edges).toEqual([
      { from: "goals", to: "plan" },
      { from: "plan", to: "execution" },
      { from: "execution", to: "acceptance" },
      { from: "focus", to: expect.any(String) },
    ]);
    expect(snapshot.logicMap.nodes.find((node) => node.id === "goals")?.href).toBe("/knowledge-base?path=memory/project/roadmap.md");
    expect(snapshot.logicMap.nodes.find((node) => node.id === "acceptance")?.href).toBe("/releases");
  }, SERVICE_TIMEOUT_MS);

  it("marks acceptance as warning when there is pending acceptance", () => {
    const snapshot = buildHomeLogicMapSnapshot({
      name: "Compounding",
      oneLiner: "summary",
      overallSummary: "overall",
      currentPhase: "phase",
      currentMilestone: "milestone",
      successCriteria: ["criterion"],
      activeStage: "acceptance",
      goals: { summary: "goals" },
      plan: { summary: "plan" },
      execution: { summary: "execution" },
      acceptance: { summary: "acceptance" },
      focus: { summary: "focus" },
      blockers: [],
      pendingAcceptance: "待验收版本 rel-1",
      runtimeAlert: null,
      healthSummary: "health",
      aiEfficiency: {
        totalSavedLabel: "~0",
        avgSavingsLabel: "0%",
        alert: null,
        contextPattern: null,
        contextMode: "balanced",
      },
    });

    expect(snapshot.logicMap.activeNodeId).toBe("acceptance");
    expect(snapshot.logicMap.nodes.find((node) => node.id === "acceptance")?.state).toBe("warning");
  });

  it("marks focus as warning when blockers exist", () => {
    const snapshot = buildHomeLogicMapSnapshot({
      name: "Compounding",
      oneLiner: "summary",
      overallSummary: "overall",
      currentPhase: "phase",
      currentMilestone: "milestone",
      successCriteria: ["criterion"],
      activeStage: "doing",
      goals: { summary: "goals" },
      plan: { summary: "plan" },
      execution: { summary: "execution" },
      acceptance: { summary: "acceptance" },
      focus: { summary: "focus" },
      blockers: ["blocked"],
      pendingAcceptance: null,
      runtimeAlert: null,
      healthSummary: "health",
      aiEfficiency: {
        totalSavedLabel: "~0",
        avgSavingsLabel: "0%",
        alert: null,
        contextPattern: null,
        contextMode: "balanced",
      },
    });

    expect(snapshot.logicMap.nodes.find((node) => node.id === "focus")?.state).toBe("warning");
  });
});
