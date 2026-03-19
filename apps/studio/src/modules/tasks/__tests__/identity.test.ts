import { describe, expect, it } from "vitest";
import { deriveShortId, matchesTaskReference, normalizeTaskReference, taskIdFromPath } from "../../../../../../shared/task-identity";

describe("task identity helpers", () => {
  it("normalizes task references from short ids, basenames and queue paths", () => {
    expect(normalizeTaskReference("tasks/queue/task-033-pre-task-safety-guardrails.md")).toBe("task-033-pre-task-safety-guardrails");
    expect(normalizeTaskReference("task-033-pre-task-safety-guardrails.md")).toBe("task-033-pre-task-safety-guardrails");
    expect(normalizeTaskReference("t-033")).toBe("t-033");
    expect(taskIdFromPath("tasks/queue/task-033-pre-task-safety-guardrails.md")).toBe("task-033-pre-task-safety-guardrails");
  });

  it("derives and matches the short task id against canonical references", () => {
    const taskId = "task-033-pre-task-safety-guardrails";
    expect(deriveShortId(taskId)).toBe("t-033");
    expect(matchesTaskReference(taskId, "t-033", "t-033")).toBe(true);
    expect(matchesTaskReference(taskId, "t-033", "tasks/queue/task-033-pre-task-safety-guardrails.md")).toBe(true);
  });
});
