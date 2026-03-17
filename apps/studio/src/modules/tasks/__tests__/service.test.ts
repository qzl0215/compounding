import { describe, expect, it } from "vitest";
import { buildTaskDeliveryRows } from "../delivery";
import { getTaskBoard, listTaskCards } from "../service";
import type { ReleaseRecord } from "@/modules/releases";

describe("tasks service", () => {
  it("parses queue docs into lightweight project-management cards", async () => {
    const tasks = await listTaskCards();
    const first = tasks.find((task) => task.path === "tasks/queue/task-001-repo-refactor.md");
    const current = tasks.find((task) => task.path === "tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md");
    const planned = tasks.find((task) => task.path === "tasks/queue/task-009-ai-work-modes-productization.md");

    expect(first).toBeTruthy();
    expect(first?.goal.length).toBeGreaterThan(0);
    expect(first?.status).toBe("done");
    expect(first?.branch).toContain("main");
    expect(first?.git.state).toBe("merged");
    expect(first?.shortId).toBe("t-001");
    expect(first?.updateTrace.docs.length).toBeGreaterThan(0);
    expect(current?.branch).toBe("codex/task-006-rich-doc-edit-and-ai-rewrite");
    expect(current?.recentCommit).toBe("bd37dec");
    expect(current?.git.state).toBeDefined();
    expect(planned?.status).toBe("done");
    expect(planned?.currentMode).toBe("发布复盘");
    expect(planned?.deliveryBenefit.length).toBeGreaterThan(0);
    expect(planned?.branch).toBe("codex/task-009-ai-work-modes-productization");
    expect(planned?.git.state).toBe("merged");
  });

  it("groups tasks by status for the board view", async () => {
    const groups = await getTaskBoard();

    expect(groups.map((group) => group.status)).toEqual(["todo", "doing", "blocked", "done"]);
  });

  it("builds delivery rows from release associations", async () => {
    const tasks = await listTaskCards();
    const target = tasks.find((task) => task.id === "task-011-anti-drift-docs-prompts-index");
    expect(target).toBeTruthy();

    const releases: ReleaseRecord[] = [
      {
        release_id: "rel-011-dev",
        commit_sha: "ffd27798a95866a9268ed0166ff47aeaf21aedc1",
        tag: null,
        source_ref: "HEAD",
        primary_task_id: "task-011-anti-drift-docs-prompts-index",
        linked_task_ids: [],
        delivery_summary: "t-011 建设防漂移文档与索引资产",
        delivery_benefit: "让 prompt 和索引更不易漂移",
        delivery_risks: "若真相源不清会继续失真",
        channel: "dev",
        acceptance_status: "pending",
        preview_url: "http://127.0.0.1:3001",
        promoted_to_main_at: null,
        promoted_from_dev_release_id: null,
        created_at: "2026-03-17T06:08:44Z",
        status: "preview",
        build_result: "passed",
        smoke_result: "passed",
        cutover_at: null,
        rollback_from: null,
        release_path: "/tmp/rel-011-dev",
        change_summary: ["ffd2779 docs: finalize task-011 anti-drift handoff"],
        notes: [],
      },
    ];

    const row = buildTaskDeliveryRows([target!], releases)[0];
    expect(row?.deliveryStatus).toBe("pending_acceptance");
    expect(row?.acceptReleaseId).toBe("rel-011-dev");
    expect(row?.versionLabel).toBe("rel-011-dev");
  });

  it("treats merged historical tasks as released even when old release records lack explicit task links", async () => {
    const tasks = await listTaskCards();
    const releasedTask = tasks.find((task) => task.id === "task-009-ai-work-modes-productization");
    expect(releasedTask).toBeTruthy();

    const row = buildTaskDeliveryRows([releasedTask!], [])[0];
    expect(row?.deliveryStatus).toBe("released");
    expect(row?.versionLabel).toContain("main@");
  });
});
