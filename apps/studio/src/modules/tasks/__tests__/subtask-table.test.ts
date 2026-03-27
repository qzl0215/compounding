import { describe, expect, it } from "vitest";
import { createEmptyTaskCostLedger } from "../../../../../../shared/task-cost";
import { buildSubtaskTableRows } from "../subtask-table";
import type { TaskDeliveryRow } from "../types";

function buildRow(
  overrides: Partial<TaskDeliveryRow> & { machine?: Partial<TaskDeliveryRow["machine"]> }
): TaskDeliveryRow {
  const { machine: machineOverrides = {}, ...rowOverrides } = overrides;
  const machine = {
    contractHash: "hash",
    stateId: "ready" as const,
    stateLabel: "待执行",
    modeId: "planning" as const,
    deliveryTrack: "undetermined" as const,
    blockedFromState: null,
    resumeToState: null,
    blockedReason: "",
    lastTransitionEvent: null,
    branch: "codex/task-000-sample",
    recentCommit: "abc1234",
    completionMode: "close_full_contract",
    primaryRelease: "未生成",
    linkedReleases: [],
    companionReleaseIds: [],
    companionLatestRelease: null,
    relatedModules: [],
    updateTrace: {
      memory: "no change",
      index: "no change",
      roadmap: "no change",
      docs: "tasks/queue/task-000-sample.md",
    },
    locks: [],
    artifactRefs: [],
    latestSearchEvidence: "",
    branchCleanup: null,
    git: {
      branch: "codex/task-000-sample",
      recentCommit: "abc1234",
      mergedToMain: false,
      state: "committed" as const,
      detail: "ready",
    },
    ...machineOverrides,
  };
  return {
    id: "task-000-sample",
    path: "tasks/queue/task-000-sample.md",
    shortId: "t-000",
    title: "任务 task-000-sample",
    status: "todo",
    parentPlan: "memory/project/operating-blueprint.md",
    summary: "sample",
    whyNow: "sample why",
    boundary: "sample boundary",
    doneWhen: "sample done",
    inScope: "sample in",
    outOfScope: "sample out",
    constraints: "sample constraints",
    risk: "sample risk",
    testStrategy: "sample test",
    acceptanceResult: "待验收",
    deliveryResult: "未交付",
    retro: "未复盘",
    currentMode: "工程执行",
    machine,
    deliveryStatus: "not_started",
    versionLabel: "未生成",
    acceptReleaseId: null,
    rollbackReleaseId: null,
    linkedTaskIds: [],
    cost: createEmptyTaskCostLedger("t-000", "任务 task-000-sample", "not_started"),
    ...rowOverrides,
  };
}

describe("buildSubtaskTableRows", () => {
  it("keeps only non-released rows and sorts by active stage priority", () => {
    const rows = buildSubtaskTableRows([
      buildRow({ id: "task-047-planning", shortId: "t-047", currentMode: "战略澄清", status: "todo", machine: { stateId: "planning" } }),
      buildRow({ id: "task-048-ready", shortId: "t-048", currentMode: "工程执行", status: "todo", machine: { stateId: "ready" } }),
      buildRow({ id: "task-049-doing", shortId: "t-049", status: "doing", machine: { stateId: "executing" } }),
      buildRow({ id: "task-050-acceptance", shortId: "t-050", deliveryStatus: "pending_acceptance", status: "done", machine: { stateId: "acceptance_pending" } }),
      buildRow({ id: "task-051-released", shortId: "t-051", deliveryStatus: "released", status: "done", machine: { stateId: "released" } }),
    ]);

    expect(rows.map((row) => row.id)).toEqual([
      "task-050-acceptance",
      "task-049-doing",
      "task-048-ready",
      "task-047-planning",
    ]);
  });
});
