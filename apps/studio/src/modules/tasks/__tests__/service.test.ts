import { describe, expect, it } from "vitest";
import { getTaskBoard, listTaskCards } from "../service";

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
    expect(first?.updateTrace.docs.length).toBeGreaterThan(0);
    expect(current?.branch).toBe("codex/task-006-rich-doc-edit-and-ai-rewrite");
    expect(current?.recentCommit).toBe("bd37dec");
    expect(current?.git.state).toBeDefined();
    expect(planned?.status).toBe("todo");
    expect(planned?.branch).toBe("codex/task-009-ai-work-modes-productization");
    expect(planned?.git.state).toBe("missing_branch");
  });

  it("groups tasks by status for the board view", async () => {
    const groups = await getTaskBoard();

    expect(groups.map((group) => group.status)).toEqual(["todo", "doing", "blocked", "done"]);
  });
});
