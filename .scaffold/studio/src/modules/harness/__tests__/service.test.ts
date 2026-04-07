import { afterEach, describe, expect, it, vi } from "vitest";
import * as harnessService from "../service";

describe("harness service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses canonical harness status output", () => {
    vi.spyOn(harnessService.harnessServiceRuntime, "runHarnessStatusCommand").mockReturnValue(
      JSON.stringify({
        schema_version: "1",
        generated_at: "2026-03-29T00:00:00.000Z",
        active_intent: {
          intent_id: "intent:task-088",
          task_id: "task-088",
          summary: "建立单一控制平面内核",
          why_now: "避免多源控制面继续漂移",
          success_criteria: "输出唯一 next action",
          constraints: "只保留单一内核",
          acceptance_owner: "human",
          created_at: "2026-03-29T00:00:00.000Z",
          source: "test",
        },
        active_contract: {
          contract_id: "contract:task-088",
          task_id: "task-088",
          task_path: "tasks/queue/task-088.md",
          short_id: "t-088",
          title: "建立单一控制平面内核",
          summary: "建立单一控制平面内核",
          why_now: "避免多源控制面继续漂移",
          boundary: "只做 phase-1",
          done_when: "输出唯一 next action",
          constraints: "单一写入口",
          risk: "双写漂移",
          delivery_track: "direct_merge",
          state_id: "ready",
          mode_id: "planning",
          branch_name: "codex/task-088-harness-control-plane",
          latest_release_id: null,
        },
        state: {
          workflow: {
            task_id: "task-088",
            task_path: "tasks/queue/task-088.md",
            state_id: "ready",
            state_label: "待执行",
            mode_id: "planning",
            mode_label: "规划",
            delivery_track: "direct_merge",
            blocked_reason: null,
            last_event_id: "evt-1",
          },
          hygiene: {
            branch: "codex/task-088-harness-control-plane",
            head_sha: "abc1234",
            has_upstream: false,
            worktree_clean: true,
            blockers: [],
            notes: [],
          },
          runtime_alignment: {
            target_channel: "prod",
            target_release_id: null,
            observed_release_id: null,
            aligned: true,
            reason: "当前没有待对齐的 release。",
          },
        },
        next_action: {
          action_id: "run_preflight",
          label: "运行 task preflight",
          owner: "agent",
          task_id: "task-088",
          command: "pnpm harness:act --action=run_preflight --taskId=t-088",
          reason: "先确认当前 guard 是否允许进入执行。",
        },
        current_executor: {
          role: "agent",
          reason: "先确认当前 guard 是否允许进入执行。",
        },
        artifacts: [],
        compatibility: {
          runtime_root: "/tmp/runtime",
          active_release_id: null,
          pending_dev_release_id: null,
          active_task_count: 0,
          blocked_task_count: 0,
          local_runtime: {
            status: "stopped",
            running: false,
            port: 3010,
            pid: null,
            runtime_release_id: null,
            current_release_id: null,
            drift: false,
            reason: "stopped",
            log_path: "/tmp/prod.log",
            state_path: "/tmp/prod.json",
          },
          local_preview: {
            status: "stopped",
            running: false,
            port: 3011,
            pid: null,
            runtime_release_id: null,
            current_release_id: null,
            drift: false,
            reason: "stopped",
            log_path: "/tmp/dev.log",
            state_path: "/tmp/dev.json",
          },
        },
      }),
    );

    const snapshot = harnessService.getHarnessLiveSnapshot();
    expect(snapshot.active_contract?.short_id).toBe("t-088");
    expect(snapshot.next_action?.action_id).toBe("run_preflight");
  });
});
