import { describe, expect, it } from "vitest";
import { normalizeGitChangedFile, parseGitChangedFiles } from "../../../../../shared/git-changed-files";

describe("git changed files helpers", () => {
  it("normalizes status output, rename markers, and ignored prefixes", () => {
    const files = parseGitChangedFiles(
      [
        " M apps/studio/src/app/page.tsx",
        "R  apps/studio/src/app/old.ts -> apps/studio/src/app/new.ts",
        "A  output/ai/report.json",
        "?? docs/notes.md",
        "?? docs/notes.md",
      ].join("\n"),
      { mode: "status", ignoredPrefixes: ["output/"] }
    );

    expect(files).toEqual(["apps/studio/src/app/page.tsx", "apps/studio/src/app/new.ts", "docs/notes.md"]);
  });

  it("keeps name-only output stable", () => {
    const files = parseGitChangedFiles("docs/WORK_MODES.md\noutput/ai/report.json\nscripts/ai/validate.ts\n", {
      mode: "name_only",
      ignoredPrefixes: ["output/"],
    });

    expect(files).toEqual(["docs/WORK_MODES.md", "scripts/ai/validate.ts"]);
  });

  it("normalizes empty and trimmed values", () => {
    expect(normalizeGitChangedFile("")).toBe("");
    expect(normalizeGitChangedFile("  docs/DEV_WORKFLOW.md  ")).toBe("docs/DEV_WORKFLOW.md");
  });
});
