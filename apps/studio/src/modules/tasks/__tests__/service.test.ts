import { describe, expect, it } from "vitest";
import { getTaskBoard, listTaskCards } from "../service";

describe("tasks service", () => {
  it("parses queue docs into lightweight project-management cards", async () => {
    const tasks = await listTaskCards();
    const first = tasks.find((task) => task.path === "tasks/queue/task-001-repo-refactor.md");

    expect(first).toBeTruthy();
    expect(first?.goal.length).toBeGreaterThan(0);
    expect(first?.status).toBeDefined();
    expect(first?.updateTrace.docs.length).toBeGreaterThan(0);
  });

  it("groups tasks by status for the board view", async () => {
    const groups = await getTaskBoard();

    expect(groups.map((group) => group.status)).toEqual(["todo", "doing", "blocked", "done"]);
  });
});
