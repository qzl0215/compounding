import { describe, expect, it } from "vitest";
import { buildTaskDeliveryRows } from "../delivery";
import { getTaskBoard, listTaskCards } from "../service";
import type { ReleaseRecord } from "@/modules/releases";
import { createEmptyTaskCostLedger } from "../../../../../../shared/task-cost";
import type { TaskDeliveryRow } from "../types";

const SERVICE_TIMEOUT_MS = 30000;

describe("tasks service", () => {
  it("parses queue docs into lightweight project-management cards", async () => {
    const tasks = await listTaskCards();
    const first = tasks.find((task) => task.path === "tasks/queue/task-001-repo-refactor.md");
    const current = tasks.find((task) => task.path === "tasks/queue/task-006-rich-doc-edit-and-ai-rewrite.md");
    const planned = tasks.find((task) => task.path === "tasks/queue/task-009-ai-work-modes-productization.md");
    const active = tasks.find((task) => task.path === "tasks/queue/task-052-drop-planning-task-model.md");

    expect(first).toBeTruthy();
    expect(first?.summary.length).toBeGreaterThan(0);
    expect(first?.status).toBe("done");
    expect(first?.machine.branch).toContain("main");
    expect(first?.machine.git.state).toBe("merged");
    expect(first?.shortId).toBe("t-001");
    expect(first?.machine.updateTrace.docs.length).toBeGreaterThan(0);
    expect(current?.machine.branch).toBe("codex/task-006-rich-doc-edit-and-ai-rewrite");
    expect(current?.machine.recentCommit).toBe("bd37dec");
    expect(current?.machine.git.state).toBeDefined();
    expect(planned?.status).toBe("done");
    expect(planned?.currentMode).toBe("发布复盘");
    expect(planned?.deliveryResult.length).toBeGreaterThan(0);
    expect(planned?.machine.branch).toBe("codex/task-009-ai-work-modes-productization");
    expect(planned?.machine.git.state).toBe("merged");
    expect(active?.status).toBe("doing");
    expect(active?.currentMode).toBe("工程执行");
    expect(Array.isArray(first?.machine.companionReleaseIds)).toBe(true);
  }, SERVICE_TIMEOUT_MS);

  it("groups tasks by status for the board view", async () => {
    const groups = await getTaskBoard();

    expect(groups.map((group) => group.status)).toEqual(["todo", "doing", "blocked", "done"]);
  }, SERVICE_TIMEOUT_MS);

  it("builds delivery rows from release associations", async () => {
    const tasks = await listTaskCards();
    const target = tasks.find((task) => task.id === "task-011-anti-drift-docs-prompts-index");
    expect(target).toBeTruthy();

    const releases: ReleaseRecord[] = [
      {
        release_id: "rel-011-dev",
        commit_sha: "ffd27798a95866a9268ed0166ff47aeaf21aedc1",
        tag: null,
        source_ref: "HEAD",
        primary_task_id: "task-011-anti-drift-docs-prompts-index",
        linked_task_ids: [],
        delivery_snapshot: {
          summary: "t-011 建设防漂移文档与索引资产",
          risk: "若真相源不清会继续失真",
          done_when: "prompt 和索引的防漂移门禁可持续工作",
          change_cost: {
            time: {
              active_ms: 120000,
              wait_ms: 30000,
              total_ms: 150000,
              dominant_stage: "review",
              repeated_blockers: 1,
              latest_blockers: ["review 等待"],
            },
            tokens: {
              summary_runs: 2,
              context_packets: 1,
              summary_input_est: 1200,
              summary_output_est: 200,
              summary_saved_est: 1000,
              context_input_est: 400,
              context_output_est: 120,
              context_saved_est: 280,
            },
            code: {
              source: "snapshot",
              files: 4,
              insertions: 80,
              deletions: 12,
            },
            effect: {
              last_gate_failures: [],
              release_state: "pending_acceptance",
              build_result: "passed",
              smoke_result: "passed",
              acceptance_status: "pending",
              blockers: [],
              status_summary: "rel-011-dev 待验收。",
            },
          },
        },
        resolved_task_contract: null,
              channel: "dev",
              acceptance_status: "pending",
              preview_url: "http://127.0.0.1:3011",
              promoted_to_main_at: null,
              promoted_from_dev_release_id: null,
        created_at: "2026-03-17T06:08:44Z",
        status: "preview",
        build_result: "passed",
        smoke_result: "passed",
        cutover_at: null,
        rollback_from: null,
        release_path: "/tmp/rel-011-dev",
        change_summary: ["ffd2779 docs: finalize task-011 anti-drift handoff"],
        notes: [],
      },
    ];

    const row = buildTaskDeliveryRows([target!], releases)[0];
    expect(row?.deliveryStatus).toBe("pending_acceptance");
    expect(row?.acceptReleaseId).toBe("rel-011-dev");
    expect(row?.versionLabel).toBe("rel-011-dev");
    expect(row?.cost.code.source).toBe("snapshot");
    expect(row?.cost.code.files).toBe(4);
    expect(row?.cost.effect.release_state).toBe("pending_acceptance");
  }, SERVICE_TIMEOUT_MS);

  it("treats merged historical tasks as released even when old release records lack explicit task links", async () => {
    const tasks = await listTaskCards();
    const releasedTask = tasks.find((task) => task.id === "task-009-ai-work-modes-productization");
    expect(releasedTask).toBeTruthy();

    const row = buildTaskDeliveryRows([releasedTask!], [])[0];
    expect(row?.deliveryStatus).toBe("released");
    expect(row?.versionLabel).toContain("main@");
  }, SERVICE_TIMEOUT_MS);

  it("does not bind releases to tasks by commit prefix alone", () => {
    const task: TaskDeliveryRow = {
      id: "task-038-autonomy-entropy-reduction",
      path: "tasks/queue/task-038-autonomy-entropy-reduction.md",
      shortId: "t-038",
      title: "任务 task-038-autonomy-entropy-reduction",
      status: "doing" as const,
      parentPlan: "memory/project/operating-blueprint.md",
      summary: "收口真相源、规则层与交付绑定中的结构性熵增点",
      whyNow: "当前双写仍在扩散",
      boundary: "收口 task / release / companion 的结构性熵增点",
      doneWhen: "状态、版本和真相源口径统一",
      inScope: "- 收口真相源\n- 精简规则",
      outOfScope: "- 不做新 UI",
      constraints: "- 不新增状态源",
      risk: "若收口不彻底会继续双写",
      testStrategy: "锁住解析和投影链",
      acceptanceResult: "待验收",
      deliveryResult: "减少歧义与重复规则",
      retro: "未复盘",
      currentMode: "工程执行",
      machine: {
        contractHash: "hash-038",
        branch: "codex/task-038-autonomy-entropy-reduction",
        recentCommit: "abc1234",
        completionMode: "close_full_contract",
        primaryRelease: "未生成",
        linkedReleases: [],
        companionReleaseIds: [],
        companionLatestRelease: null,
        relatedModules: ["shared/task-identity.ts"],
        updateTrace: {
          memory: "no change",
          index: "no change",
          roadmap: "no change",
          docs: "tasks/queue/task-038-autonomy-entropy-reduction.md",
        },
        locks: [],
        artifactRefs: [],
        latestSearchEvidence: "",
        git: {
          branch: "codex/task-038-autonomy-entropy-reduction",
          recentCommit: "abc1234",
          mergedToMain: false,
          state: "committed",
          detail: "ready",
        },
      },
      deliveryStatus: "in_progress",
      versionLabel: "未生成",
      acceptReleaseId: null,
      rollbackReleaseId: null,
      linkedTaskIds: [],
      cost: createEmptyTaskCostLedger("t-038", "任务 task-038-autonomy-entropy-reduction", "in_progress"),
    };

    const release: ReleaseRecord = {
      release_id: "rel-heuristic-only-dev",
      commit_sha: "abc1234deadbeef",
      tag: null,
      source_ref: "HEAD",
      primary_task_id: null,
      linked_task_ids: [],
      delivery_snapshot: {
        summary: "heuristic-only",
        risk: null,
        done_when: null,
      },
      resolved_task_contract: null,
      channel: "dev",
      acceptance_status: "pending",
      preview_url: "http://127.0.0.1:3011",
      promoted_to_main_at: null,
      promoted_from_dev_release_id: null,
      created_at: "2026-03-22T10:00:00Z",
      status: "preview",
      build_result: "passed",
      smoke_result: "passed",
      cutover_at: null,
      rollback_from: null,
      release_path: "/tmp/rel-heuristic-only-dev",
      change_summary: ["abc1234 fix: commit-only reference"],
      notes: [],
    };

    const row = buildTaskDeliveryRows([task], [release])[0];
    expect(row.deliveryStatus).toBe("in_progress");
    expect(row.acceptReleaseId).toBeNull();
    expect(row.versionLabel).toBe("未生成");
    expect(row.cost.task_id).toBe("t-038");
  });

  it("does not surface promoted stale dev previews as pending acceptance", async () => {
    const tasks = await listTaskCards();
    const releasedTask = tasks.find((task) => task.id === "task-009-ai-work-modes-productization");
    expect(releasedTask).toBeTruthy();

    const releases: ReleaseRecord[] = [
      {
        release_id: "rel-009-dev",
        commit_sha: "2222222",
        tag: null,
        source_ref: "HEAD",
        primary_task_id: "task-009-ai-work-modes-productization",
        linked_task_ids: [],
        delivery_snapshot: {
          summary: "stale dev",
          risk: null,
          done_when: null,
        },
        resolved_task_contract: null,
        channel: "dev",
        acceptance_status: "pending",
        preview_url: "http://127.0.0.1:3011",
        promoted_to_main_at: null,
        promoted_from_dev_release_id: null,
        created_at: "2026-03-25T09:00:00Z",
        status: "preview",
        build_result: "passed",
        smoke_result: "passed",
        cutover_at: null,
        rollback_from: null,
        release_path: "/tmp/rel-009-dev",
        change_summary: ["2222222 preview"],
        notes: [],
      },
      {
        release_id: "rel-009-prod",
        commit_sha: "2222222",
        tag: "release-rel-009-prod",
        source_ref: "main",
        primary_task_id: "task-009-ai-work-modes-productization",
        linked_task_ids: [],
        delivery_snapshot: {
          summary: "prod",
          risk: null,
          done_when: null,
        },
        resolved_task_contract: null,
        channel: "prod",
        acceptance_status: "accepted",
        preview_url: null,
        promoted_to_main_at: null,
        promoted_from_dev_release_id: "rel-009-dev",
        created_at: "2026-03-25T09:20:00Z",
        status: "active",
        build_result: "passed",
        smoke_result: "passed",
        cutover_at: "2026-03-25T09:25:00Z",
        rollback_from: null,
        release_path: "/tmp/rel-009-prod",
        change_summary: ["2222222 promote"],
        notes: [],
      },
    ];

    const row = buildTaskDeliveryRows([releasedTask!], releases)[0];
    expect(row.deliveryStatus).toBe("released");
    expect(row.acceptReleaseId).toBeNull();
    expect(row.versionLabel).toBe("rel-009-prod");
  }, SERVICE_TIMEOUT_MS);
});
