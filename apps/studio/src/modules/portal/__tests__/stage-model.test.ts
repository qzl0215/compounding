import { describe, expect, it } from "vitest";
import type { TaskDeliveryRow } from "@/modules/tasks";
import { resolveTaskDemandStage } from "../stage-model";

function buildRow(overrides: Partial<TaskDeliveryRow> = {}): TaskDeliveryRow {
  return {
    id: "task-999-example",
    path: "tasks/queue/task-999-example.md",
    shortId: "t-999",
    title: "示例任务",
    status: "todo",
    parentPlan: "memory/project/operating-blueprint.md",
    summary: "示例任务摘要",
    whyNow: "示例为什么现在",
    boundary: "示例承接边界",
    doneWhen: "示例完成定义",
    inScope: "- 示例要做",
    outOfScope: "- 示例不做",
    constraints: "- 示例约束",
    risk: "示例风险",
    testStrategy: "示例测试策略",
    acceptanceResult: "待验收",
    deliveryResult: "示例交付结果",
    retro: "示例复盘",
    currentMode: "工程执行",
    machine: {
      contractHash: "hash-999",
      branch: "codex/task-999-example",
      recentCommit: "abc1234",
      completionMode: "close_full_contract",
      primaryRelease: "未生成",
      linkedReleases: [],
      companionReleaseIds: [],
      companionLatestRelease: null,
      relatedModules: [],
      updateTrace: {
        memory: "no change: test fixture",
        index: "no change: test fixture",
        roadmap: "no change: test fixture",
        docs: "no change: test fixture",
      },
      locks: [],
      artifactRefs: [],
      latestSearchEvidence: "",
      git: {
        branch: "codex/task-999-example",
        recentCommit: "abc1234",
        mergedToMain: false,
        state: "developing",
        detail: "开发中",
      },
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
  it("treats todo tasks as ready even when legacy planning modes still exist", () => {
    expect(resolveTaskDemandStage(buildRow({ currentMode: "战略澄清", status: "todo" }))).toBe("ready");
    expect(resolveTaskDemandStage(buildRow({ currentMode: "方案评审", status: "todo" }))).toBe("ready");
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
