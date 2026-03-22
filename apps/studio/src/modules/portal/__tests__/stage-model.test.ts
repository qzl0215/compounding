import { describe, expect, it } from "vitest";
import type { TaskDeliveryRow } from "@/modules/tasks";
import { resolveTaskDemandStage } from "../stage-model";

function buildRow(overrides: Partial<TaskDeliveryRow> = {}): TaskDeliveryRow {
  return {
    id: "task-999-example",
    path: "tasks/queue/task-999-example.md",
    shortId: "t-999",
    title: "示例任务",
    goal: "示例目标",
    status: "todo",
    currentMode: "工程执行",
    branch: "codex/task-999-example",
    recentCommit: "abc1234",
    deliveryBenefit: "示例收益",
    deliveryRisk: "示例风险",
    deliveryRetro: "示例复盘",
    primaryRelease: "未生成",
    linkedReleases: [],
    companionReleaseIds: [],
    companionLatestRelease: null,
    git: {
      branch: "codex/task-999-example",
      recentCommit: "abc1234",
      mergedToMain: false,
      state: "developing",
      detail: "开发中",
    },
    relatedModules: [],
    updateTrace: {
      memory: "no change: test fixture",
      index: "no change: test fixture",
      roadmap: "no change: test fixture",
      docs: "no change: test fixture",
    },
    deliveryStatus: "not_started",
    versionLabel: "未生成",
    acceptReleaseId: null,
    rollbackReleaseId: null,
    linkedTaskIds: [],
    ...overrides,
  };
}

describe("resolveTaskDemandStage", () => {
  it("keeps strategic clarification and solution review tasks in planning when not started", () => {
    expect(resolveTaskDemandStage(buildRow({ currentMode: "战略澄清", status: "todo" }))).toBe("planning");
    expect(resolveTaskDemandStage(buildRow({ currentMode: "方案评审", status: "todo" }))).toBe("planning");
  });

  it("treats doing and blocked tasks as doing even if their mode is planning", () => {
    expect(resolveTaskDemandStage(buildRow({ currentMode: "战略澄清", status: "doing" }))).toBe("doing");
    expect(resolveTaskDemandStage(buildRow({ currentMode: "方案评审", status: "blocked" }))).toBe("doing");
  });

  it("treats todo execution tasks as ready", () => {
    expect(resolveTaskDemandStage(buildRow({ currentMode: "工程执行", status: "todo" }))).toBe("ready");
  });

  it("treats pending acceptance as acceptance", () => {
    expect(resolveTaskDemandStage(buildRow({ deliveryStatus: "pending_acceptance", status: "done", currentMode: "质量验收" }))).toBe(
      "acceptance"
    );
  });

  it("treats released and rolled back tasks as released stage", () => {
    expect(resolveTaskDemandStage(buildRow({ deliveryStatus: "released", status: "done" }))).toBe("released");
    expect(resolveTaskDemandStage(buildRow({ deliveryStatus: "rolled_back", status: "done" }))).toBe("released");
  });
});
