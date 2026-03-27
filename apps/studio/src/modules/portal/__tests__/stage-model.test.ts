import { describe, expect, it } from "vitest";
import type { TaskDeliveryRow } from "@/modules/tasks";
import { resolveTaskDemandStage } from "../stage-model";

function buildRow(
  overrides: Partial<TaskDeliveryRow> & { machine?: Partial<TaskDeliveryRow["machine"]> } = {}
): TaskDeliveryRow {
  const { machine: machineOverrides = {}, ...rowOverrides } = overrides;
  const machine = {
    contractHash: "hash-999",
    stateId: "ready" as const,
    stateLabel: "待执行",
    modeId: "planning" as const,
    deliveryTrack: "undetermined" as const,
    blockedFromState: null,
    resumeToState: null,
    blockedReason: "",
    lastTransitionEvent: null,
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
    branchCleanup: null,
    git: {
      branch: "codex/task-999-example",
      recentCommit: "abc1234",
      mergedToMain: false,
      state: "developing" as const,
      detail: "开发中",
    },
    ...machineOverrides,
  };
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
    machine,
    deliveryStatus: "not_started",
    versionLabel: "未生成",
    acceptReleaseId: null,
    rollbackReleaseId: null,
    linkedTaskIds: [],
    ...rowOverrides,
  };
}

describe("resolveTaskDemandStage", () => {
  it("treats planning state as planning stage", () => {
    expect(resolveTaskDemandStage(buildRow({ currentMode: "战略澄清", status: "todo", machine: { stateId: "planning" } }))).toBe("planning");
  });

  it("treats ready state as ready stage", () => {
    expect(resolveTaskDemandStage(buildRow({ currentMode: "工程执行", status: "todo", machine: { stateId: "ready" } }))).toBe("ready");
  });

  it("treats executing and blocked states as doing", () => {
    expect(resolveTaskDemandStage(buildRow({ status: "doing", machine: { stateId: "executing" } }))).toBe("doing");
    expect(resolveTaskDemandStage(buildRow({ status: "blocked", machine: { stateId: "blocked" } }))).toBe("doing");
  });

  it("treats pending acceptance as acceptance", () => {
    expect(resolveTaskDemandStage(buildRow({ deliveryStatus: "pending_acceptance", status: "done", machine: { stateId: "acceptance_pending" } }))).toBe(
      "acceptance"
    );
  });

  it("treats released and rolled back tasks as released stage", () => {
    expect(resolveTaskDemandStage(buildRow({ deliveryStatus: "released", status: "done", machine: { stateId: "released" } }))).toBe("released");
    expect(resolveTaskDemandStage(buildRow({ deliveryStatus: "rolled_back", status: "done", machine: { stateId: "rolled_back" } }))).toBe("released");
  });
});
