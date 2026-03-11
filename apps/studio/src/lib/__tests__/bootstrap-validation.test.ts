import { describe, expect, it } from "vitest";
import { validateProjectBrief } from "../bootstrap-validation";
import type { ProjectBrief, ProjectBriefSchema } from "../types";

const schema: ProjectBriefSchema = {
  title: "Test Schema",
  type: "object",
  required: ["project_name", "project_one_liner", "success_definition", "current_priority", "must_protect", "runtime_boundary"],
  properties: {
    project_name: { type: "string" },
    project_one_liner: { type: "string" },
    success_definition: { type: "string" },
    current_priority: { type: "string" },
    must_protect: { type: "array", items: { type: "string" } },
    runtime_boundary: { type: "string", enum: ["server-only", "local-only", "hybrid"] }
  }
};

const validBrief: ProjectBrief = {
  project_name: "Compounding",
  project_one_liner: "AI OS bootstrap",
  success_definition: "Users can safely initialize and use agents.",
  current_priority: "Finish the task workbench.",
  must_protect: ["Git truth", "Review before write"],
  runtime_boundary: "server-only"
};

describe("validateProjectBrief", () => {
  it("accepts a valid brief", () => {
    expect(validateProjectBrief(validBrief, schema)).toEqual({});
  });

  it("returns field errors for invalid values", () => {
    const invalid = {
      ...validBrief,
      current_priority: "",
      must_protect: [],
      runtime_boundary: "invalid" as ProjectBrief["runtime_boundary"]
    };
    const errors = validateProjectBrief(invalid, schema);
    expect(errors.current_priority).toContain("非空字符串");
    expect(errors.must_protect).toContain("字符串数组");
    expect(errors.runtime_boundary).toContain("必须是以下值之一");
  });
});
