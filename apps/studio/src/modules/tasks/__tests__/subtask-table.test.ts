import { describe, expect, it } from "vitest";
import { createEmptyTaskCostLedger } from "../../../../../../shared/task-cost";
import { buildSubtaskTableRows } from "../subtask-table";
import type { TaskDeliveryRow } from "../types";

function buildRow(overrides: Partial<TaskDeliveryRow>): TaskDeliveryRow {
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
    machine: {
      contractHash: "hash",
      branch: "codex/task-000-sample",
      recentCommit: "abc1234",
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
      git: {
        branch: "codex/task-000-sample",
        recentCommit: "abc1234",
        mergedToMain: false,
        state: "committed",
        detail: "ready",
      },
    },
    deliveryStatus: "not_started",
    versionLabel: "未生成",
    acceptReleaseId: null,
    rollbackReleaseId: null,
    linkedTaskIds: [],
    cost: createEmptyTaskCostLedger("t-000", "任务 task-000-sample", "not_started"),
    ...overrides,
  };
}

describe("buildSubtaskTableRows", () => {
  it("keeps only non-released rows and sorts by active stage priority", () => {
    const rows = buildSubtaskTableRows([
      buildRow({ id: "task-047-legacy-ready", shortId: "t-047", currentMode: "战略澄清", status: "todo" }),
      buildRow({ id: "task-048-ready", shortId: "t-048", currentMode: "工程执行", status: "todo" }),
      buildRow({ id: "task-049-doing", shortId: "t-049", status: "doing" }),
      buildRow({ id: "task-050-acceptance", shortId: "t-050", deliveryStatus: "pending_acceptance", status: "done" }),
      buildRow({ id: "task-051-released", shortId: "t-051", deliveryStatus: "released", status: "done" }),
    ]);

    expect(rows.map((row) => row.id)).toEqual([
      "task-050-acceptance",
      "task-049-doing",
      "task-047-legacy-ready",
      "task-048-ready",
    ]);
  });
});
