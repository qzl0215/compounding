import { describe, expect, it, vi } from "vitest";
import * as deliveryModule from "@/modules/delivery";
import * as portalModule from "@/modules/portal";
import * as projectStateModule from "@/modules/project-state";
import { getOrchestrationSnapshot } from "../service";

vi.mock("@/modules/delivery", () => ({
  getDeliverySnapshot: vi.fn(),
}));

vi.mock("@/modules/project-state", () => ({
  getProjectStateSnapshot: vi.fn(),
}));

vi.mock("@/modules/portal", () => ({
  getHomeStatusBoard: vi.fn(),
}));

describe("orchestration service", () => {
  it("builds a single shared read model from delivery, project-state and home", async () => {
    const deliverySnapshot = {
      facts: {
        harness: {
          schema_version: "1",
          generated_at: "2026-03-29T00:00:00.000Z",
          active_intent: null,
          active_contract: null,
          state: {
            workflow: {
              task_id: null,
              task_path: null,
              state_id: "idle",
              state_label: "空闲",
              mode_id: null,
              mode_label: null,
              delivery_track: "undetermined",
              blocked_reason: null,
              last_event_id: null,
            },
            hygiene: {
              branch: "main",
              head_sha: null,
              has_upstream: true,
              worktree_clean: true,
              blockers: [],
              notes: [],
            },
            runtime_alignment: {
              target_channel: null,
              target_release_id: null,
              observed_release_id: null,
              aligned: true,
              reason: "当前没有待对齐的 release。",
            },
          },
          next_action: null,
          current_executor: {
            role: "harness",
            reason: "当前没有待执行动作。",
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
        },
        taskCards: [],
        releaseDashboard: {
          runtime_root: "/tmp/runtime",
          active_release_id: null,
          active_release: null,
          pending_dev_release: null,
          dev_preview_url: "http://localhost:3011",
          production_url: "http://localhost:3010",
          releases: [],
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
        diffAware: {
          state: "clean",
          summary: "无差异",
          scopeSummary: "无差异",
          reviewSummary: "无差异",
          retroSummary: "无差异",
          shipLog: [],
          suggestedChecks: [],
          selectedChecks: { required: [], recommended: [] },
          retirementSuggestions: [],
          evidencePoints: [],
          nextActions: [],
          changedFiles: [],
          categories: [],
          healthScore: { score: 100, grade: "A", reason: "clean" },
          stats: { files: 0, insertions: 0, deletions: 0 },
        },
      },
      projections: {
        taskRows: [],
        taskOptions: [],
      },
    };
    const projectState = {
      identity: {
        name: "Compounding",
        oneLiner: "shared",
      },
      headline: {
        overallSummary: "overall",
        currentPhase: "phase",
        currentMilestone: "milestone",
        currentPriority: "priority",
      },
      success: { criteria: ["criterion"] },
      plan: {
        overview: "overview",
        thinkingBacklog: [],
        planningBacklog: [],
        summary: "summary",
      },
      execution: {
        summary: "summary",
        counts: {
          total: 0,
          planning: 0,
          ready: 0,
          doing: 0,
          blocked: 0,
          acceptance: 0,
          released: 0,
        },
        cleanup: {
          scheduled: 0,
          failed: 0,
          overdue: 0,
          legacy: 0,
          alert: null,
        },
      },
      focus: {
        current: ["focus"],
        blockers: [],
        nextCheckpoint: ["checkpoint"],
        summary: "focus summary",
      },
      release: {
        activeReleaseId: null,
        pendingAcceptance: null,
        runtimeAlert: null,
        healthSummary: "health",
        conclusion: "conclusion",
        nextAction: "next action",
      },
      githubSurface: {
        summary: "github",
        missingCount: 0,
        steps: [],
      },
      aiEfficiency: {
        dashboard: {
          overview: {
            summary_runs: 0,
            context_packets: 0,
            total_input_tokens_est: 0,
            total_output_tokens_est: 0,
            total_saved_tokens_est: 0,
            avg_savings_pct_est: 0,
          },
          consumption: {
            top_profiles_by_input: [],
            top_commands_by_input: [],
            recent_daily_input: [],
          },
          savings: {
            top_profiles_by_saved: [],
            top_commands_by_saved: [],
            recent_daily_saved: [],
          },
          coverage: {
            observed_profiles: [],
            supported_profiles: [],
            never_used_profiles: [],
          },
          trend_delta: {
            last_7d_input: 0,
            prev_7d_input: 0,
            last_7d_saved: 0,
            prev_7d_saved: 0,
            last_7d_adoption: 0,
            prev_7d_adoption: 0,
          },
          context_density: {
            total_packets: 0,
            balanced_pct: 0,
            total_saved_tokens_est: 0,
            top_context_heavy_tasks: [],
          },
          context_waste: {
            top_time_loss_patterns: [],
            top_missed_shortcuts: [],
            promotion_candidates: [],
            learning_candidates: [],
            promotion_queue: [],
          },
          adoption: {
            alerts: [],
            deterministic_shortcuts: [],
          },
          task_rollups: [],
          task_costs: [],
          health: {
            raw_trace_rate_pct: 0,
          },
        },
      },
      activeStage: "ready",
      judgement: {
        oneLiner: "one liner",
        overallSummary: "overall",
        currentPhase: "phase",
        currentMilestone: "milestone",
        currentPriority: "priority",
        successCriteria: ["criterion"],
        planOverview: "overview",
        thinkingBacklog: [],
        planningBacklog: [],
        planSummary: "plan summary",
        executionSummary: "execution",
        currentFocus: ["focus"],
        blockers: [],
        nextCheckpoint: ["checkpoint"],
        focusSummary: "focus summary",
        pendingAcceptance: null,
        runtimeAlert: null,
        healthSummary: "health",
        conclusion: "conclusion",
        nextAction: "next action",
        recommendedSurface: {
          href: "/",
          label: "surface",
          description: "desc",
          scope: "agents",
        },
        recommendedRead: {
          label: "read",
          path: "memory/project/current-state.md",
          description: "desc",
        },
        activeStage: "ready",
      },
    };
    const home = {
      identity: {
        name: "Compounding",
        oneLiner: "home",
      },
      headline: {
        overallSummary: "overall",
        currentPhase: "phase",
        currentMilestone: "milestone",
      },
      success: { criteria: ["criterion"] },
      logicMap: {
        activeNodeId: "goals",
        edges: [{ from: "goals", to: "plan" }],
        nodes: [
          {
            id: "goals",
            label: "目标与里程碑",
            href: "/knowledge-base?path=memory/project/roadmap.md",
            summary: "summary",
            state: "healthy",
          },
        ],
      },
      attention: {
        blockers: [],
        pendingAcceptance: null,
        runtimeAlert: null,
        githubSurfaceAlert: null,
        healthSummary: "health",
      },
      aiEfficiency: {
        totalSavedLabel: "~0",
        avgSavingsLabel: "0%",
        alert: null,
        contextPattern: null,
        contextMode: "balanced",
      },
    };

    vi.mocked(deliveryModule.getDeliverySnapshot).mockResolvedValue(deliverySnapshot as never);
    vi.mocked(projectStateModule.getProjectStateSnapshot).mockResolvedValue(projectState as never);
    vi.mocked(portalModule.getHomeStatusBoard).mockResolvedValue(home as never);

    const snapshot = await getOrchestrationSnapshot();

    expect(snapshot.generatedAt).toMatch(/T/);
    expect(snapshot.delivery).toBe(deliverySnapshot);
    expect(snapshot.projectState).toBe(projectState);
    expect(snapshot.home).toBe(home);
    expect(snapshot.harness).toBe(deliverySnapshot.facts.harness);
    expect(deliveryModule.getDeliverySnapshot).toHaveBeenCalledTimes(1);
    expect(projectStateModule.getProjectStateSnapshot).toHaveBeenCalledWith({ deliverySnapshot });
    expect(portalModule.getHomeStatusBoard).toHaveBeenCalledWith({ projectState });
  });
});
