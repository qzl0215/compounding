import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseTaskContract, parseTaskMachineFacts } from "../../../../../../shared/task-contract";

const ROOT = path.resolve(process.cwd(), "..", "..");
const TASK_PATH = path.join(ROOT, "tasks", "queue", "task-001-repo-refactor.md");

describe("task contract boundary", () => {
  it("keeps human contract separate from machine facts", () => {
    const content = fs.readFileSync(TASK_PATH, "utf8");
    const contract = parseTaskContract("tasks/queue/task-001-repo-refactor.md", content);
    const machine = parseTaskMachineFacts(content);

    expect(contract).not.toHaveProperty("currentMode");
    expect(contract).not.toHaveProperty("branch");
    expect(contract).not.toHaveProperty("recentCommit");
    expect(contract).not.toHaveProperty("relatedModules");
    expect(contract).not.toHaveProperty("primaryRelease");
    expect(contract).not.toHaveProperty("linkedReleases");

    expect(machine.currentMode).toBeTruthy();
    expect(machine.branch).toBeTruthy();
    expect(Array.isArray(machine.relatedModules)).toBe(true);
  });
});
