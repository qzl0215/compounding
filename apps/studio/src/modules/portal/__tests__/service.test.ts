import { describe, expect, it } from "vitest";
import { getPortalOverview } from "../service";

describe("portal overview", () => {
  it("surfaces project intro, tasks, memory, index, and role overview from markdown sources", async () => {
    const overview = await getPortalOverview();

    expect(overview.projectIntro).toContain("项目名称");
    expect(overview.currentFocus).toContain("修复生产构建 Tailwind 样式裁剪问题");
    expect(overview.roadmap).toContain("# Roadmap");
    expect(overview.tasks.some((task) => task.path === "tasks/queue/task-001-repo-refactor.md")).toBe(true);
    expect(overview.memory.some((entry) => entry.path === "memory/project/tech-debt.md")).toBe(true);
    expect(overview.index.some((entry) => entry.path === "code_index/module-index.md")).toBe(true);
    expect(overview.roleOverview).toContain("Foreman");
  });
});
