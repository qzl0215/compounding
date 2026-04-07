import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveWorkspaceRoot } from "../workspace";

const cleanupTargets: string[] = [];

afterEach(async () => {
  await Promise.all(
    cleanupTargets.splice(0).map(async (target) => {
      await fs.rm(target, { recursive: true, force: true });
    }),
  );
});

describe("resolveWorkspaceRoot", () => {
  it("walks upward until it finds the repo markers", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "workspace-root-"));
    cleanupTargets.push(tempRoot);

    await fs.mkdir(path.join(tempRoot, "memory", "project"), { recursive: true });
    await fs.mkdir(path.join(tempRoot, "apps", "studio"), { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(tempRoot, "AGENTS.md"), "# agents\n"),
      fs.writeFile(path.join(tempRoot, "memory", "project", "operating-blueprint.md"), "# blueprint\n"),
      fs.writeFile(path.join(tempRoot, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n"),
    ]);

    expect(resolveWorkspaceRoot(path.join(tempRoot, "apps", "studio"))).toBe(tempRoot);
  });

  it("falls back to the historical two-level heuristic when markers are absent", () => {
    const nestedDir = path.join(path.sep, "tmp", "compounding", "apps", "studio");

    expect(resolveWorkspaceRoot(nestedDir)).toBe(path.resolve(nestedDir, "../.."));
  });
});
