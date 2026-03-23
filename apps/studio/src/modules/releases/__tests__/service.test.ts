import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveReleaseActionRedirect } from "../actions";
import { getManagementAccessState, getReleaseDashboard, readReleaseRegistry } from "../service";
import { RELEASE_VALIDATION_ORDER, VALIDATION_LAYERS } from "../validation";

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
          pending_dev_release_id: "rel-003",
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
              channel: "prod",
              acceptance_status: "accepted",
              preview_url: null,
              promoted_to_main_at: null,
              promoted_from_dev_release_id: null,
              created_at: "2026-03-15T10:00:00Z",
              status: "active",
              build_result: "passed",
              smoke_result: "passed",
              cutover_at: "2026-03-15T10:05:00Z",
              rollback_from: null,
              release_path: "/tmp/rel-002",
              change_summary: ["2222222 second"],
              notes: ["reload skipped"]
            },
            {
              release_id: "rel-003",
              commit_sha: "3333333",
              tag: null,
              source_ref: "codex/task-014-dev-preview-channel",
              channel: "dev",
              acceptance_status: "pending",
              preview_url: "http://127.0.0.1:3011",
              promoted_to_main_at: null,
              promoted_from_dev_release_id: null,
              created_at: "2026-03-15T10:10:00Z",
              status: "preview",
              build_result: "passed",
              smoke_result: "passed",
              cutover_at: null,
              rollback_from: null,
              release_path: "/tmp/rel-003",
              change_summary: ["3333333 preview"],
              notes: []
            }
          ]
        },
        null,
        2
      )
    );

    expect(readReleaseRegistry().active_release_id).toBe("rel-002");
    expect(getReleaseDashboard().active_release?.release_id).toBe("rel-002");
    expect(getReleaseDashboard().pending_dev_release?.release_id).toBe("rel-003");
    expect(getReleaseDashboard().releases[0]?.release_id).toBe("rel-003");
  });

  it("prefers task contract summary and falls back to delivery snapshot", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "compounding-release-summary-"));
    const registryPath = path.join(tempRoot, "registry.json");
    process.env.AI_OS_RELEASE_ROOT = tempRoot;
    fs.writeFileSync(
      registryPath,
      JSON.stringify(
        {
          active_release_id: "rel-fallback",
          pending_dev_release_id: "rel-task",
          updated_at: "2026-03-23T10:00:00Z",
          releases: [
            {
              release_id: "rel-task",
              commit_sha: "1111111",
              tag: null,
              source_ref: "HEAD",
              primary_task_id: "task-041-task-execution-contract",
              linked_task_ids: [],
              delivery_snapshot: {
                summary: "旧快照摘要",
                risk: "旧快照风险",
                done_when: "旧快照完成定义"
              },
              channel: "dev",
              acceptance_status: "pending",
              preview_url: "http://127.0.0.1:3011",
              promoted_to_main_at: null,
              promoted_from_dev_release_id: null,
              created_at: "2026-03-23T10:00:00Z",
              status: "preview",
              build_result: "passed",
              smoke_result: "passed",
              cutover_at: null,
              rollback_from: null,
              release_path: "/tmp/rel-task",
              change_summary: [],
              notes: []
            },
            {
              release_id: "rel-fallback",
              commit_sha: "2222222",
              tag: null,
              source_ref: "HEAD",
              primary_task_id: "task-missing",
              linked_task_ids: [],
              delivery_snapshot: {
                summary: "仅快照摘要",
                risk: "仅快照风险",
                done_when: "仅快照完成定义"
              },
              channel: "prod",
              acceptance_status: "accepted",
              preview_url: null,
              promoted_to_main_at: null,
              promoted_from_dev_release_id: null,
              created_at: "2026-03-23T09:00:00Z",
              status: "active",
              build_result: "passed",
              smoke_result: "passed",
              cutover_at: "2026-03-23T09:05:00Z",
              rollback_from: null,
              release_path: "/tmp/rel-fallback",
              change_summary: [],
              notes: []
            }
          ]
        },
        null,
        2
      )
    );

    const dashboard = getReleaseDashboard();
    expect(dashboard.pending_dev_release?.resolved_task_contract?.task_id).toBe("task-041-task-execution-contract");
    expect(dashboard.pending_dev_release?.resolved_task_contract?.summary).toBeTruthy();
    expect(dashboard.pending_dev_release?.delivery_snapshot?.summary).toBe("旧快照摘要");
    expect(dashboard.active_release?.resolved_task_contract).toBeNull();
    expect(dashboard.active_release?.delivery_snapshot?.summary).toBe("仅快照摘要");
  });

  it("exposes the fixed validation layer order", () => {
    expect(RELEASE_VALIDATION_ORDER).toEqual(["static", "build", "runtime", "ai-output"]);
    expect(VALIDATION_LAYERS).toHaveLength(4);
    expect(VALIDATION_LAYERS[0]?.commands[0]).toBe("pnpm validate:static");
  });

  it("redirects release actions to a stable environment after success", () => {
    expect(
      resolveReleaseActionRedirect(
        "create-dev",
        { links: { dev: "http://127.0.0.1:3011" } },
        "http://127.0.0.1:3011",
        "http://127.0.0.1:3010"
      )
    ).toBe("http://127.0.0.1:3011/releases");

    expect(
      resolveReleaseActionRedirect(
        "accept-dev",
        { links: { production: "http://127.0.0.1:3010" } },
        "http://127.0.0.1:3011",
        "http://127.0.0.1:3010"
      )
    ).toBe("http://127.0.0.1:3010/releases");
  });
});
