import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getManagementAccessState, getReleaseDashboard, readReleaseRegistry } from "../service";

describe("releases service", () => {
  afterEach(() => {
    delete process.env.AI_OS_RELEASE_ROOT;
  });

  it("allows localhost and private network management access", () => {
    expect(getManagementAccessState({ host: "127.0.0.1:3000" }).allowed).toBe(true);
    expect(getManagementAccessState({ host: "localhost:3000" }).allowed).toBe(true);
    expect(getManagementAccessState({ "x-real-ip": "192.168.31.9" }).allowed).toBe(true);
    expect(getManagementAccessState({ host: "example.com", "x-forwarded-for": "8.8.8.8" }).allowed).toBe(false);
  });

  it("reads release registry and exposes newest active release", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "compounding-release-"));
    const registryPath = path.join(tempRoot, "registry.json");
    process.env.AI_OS_RELEASE_ROOT = tempRoot;
    fs.writeFileSync(
      registryPath,
      JSON.stringify(
        {
          active_release_id: "rel-002",
          updated_at: "2026-03-15T10:00:00Z",
          releases: [
            {
              release_id: "rel-001",
              commit_sha: "1111111",
              tag: null,
              source_ref: "main",
              created_at: "2026-03-15T09:00:00Z",
              status: "superseded",
              build_result: "passed",
              smoke_result: "passed",
              cutover_at: "2026-03-15T09:05:00Z",
              rollback_from: null,
              release_path: "/tmp/rel-001",
              change_summary: ["1111111 first"],
              notes: []
            },
            {
              release_id: "rel-002",
              commit_sha: "2222222",
              tag: "release-rel-002",
              source_ref: "main",
              created_at: "2026-03-15T10:00:00Z",
              status: "active",
              build_result: "passed",
              smoke_result: "passed",
              cutover_at: "2026-03-15T10:05:00Z",
              rollback_from: null,
              release_path: "/tmp/rel-002",
              change_summary: ["2222222 second"],
              notes: ["reload skipped"]
            }
          ]
        },
        null,
        2
      )
    );

    expect(readReleaseRegistry().active_release_id).toBe("rel-002");
    expect(getReleaseDashboard().active_release?.release_id).toBe("rel-002");
    expect(getReleaseDashboard().releases[0]?.release_id).toBe("rel-002");
  });
});
