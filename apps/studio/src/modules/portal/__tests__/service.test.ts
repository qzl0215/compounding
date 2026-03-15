import { describe, expect, it } from "vitest";
import { getPortalOverview } from "../service";

describe("portal overview", () => {
  it("surfaces project intro, tasks, memory, index, and role overview from markdown sources", async () => {
    const overview = await getPortalOverview();

    expect(overview.projectIntro).toContain("项目名称");
    expect(overview.currentFocus).toContain("live 文档主标题改成中文友好写法");
    expect(overview.roadmap).toContain("# roadmap");
    expect(overview.tasks.some((task) => task.path === "tasks/queue/task-001-repo-refactor.md")).toBe(true);
    expect(overview.tasks.some((task) => task.path === "tasks/queue/task-002-ui-task-pm-and-doc-localization.md")).toBe(true);
    expect(overview.memory.some((entry) => entry.path === "memory/project/tech-debt.md")).toBe(true);
    expect(overview.index.some((entry) => entry.path === "code_index/module-index.md")).toBe(true);
    expect(overview.roleOverview).toContain("Foreman");
  });
});
