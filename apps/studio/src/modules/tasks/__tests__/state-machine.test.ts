import { describe, expect, it } from "vitest";
import {
  createInitialTaskMachine,
  loadTaskStateMachine,
  transitionTaskMachine,
} from "../../../../../../shared/task-state-machine";

describe("task state machine", () => {
  it("loads the canonical spec with required states and modes", () => {
    const spec = loadTaskStateMachine(process.cwd());

    expect(spec.modes.map((item) => item.mode_id)).toEqual(["planning", "execution", "review", "release"]);
    expect(spec.states.some((item) => item.state_id === "planning")).toBe(true);
    expect(spec.states.some((item) => item.state_id === "acceptance_pending")).toBe(true);
    expect(spec.transitions.some((item) => item.event_id === "review_passed")).toBe(true);
  });

  it("walks the direct-merge happy path", () => {
    const planning = createInitialTaskMachine();
    const ready = transitionTaskMachine(planning, "plan_approved");
    const executing = transitionTaskMachine(ready, "preflight_passed", { change_class: "structural" });
    const reviewPending = transitionTaskMachine(executing, "handoff_created");
    const reviewing = transitionTaskMachine(reviewPending, "review_started");
    const released = transitionTaskMachine(reviewing, "review_passed", { delivery_track: "direct_merge" });

    expect(ready.state_id).toBe("ready");
    expect(executing.state_id).toBe("executing");
    expect(executing.delivery_track).toBe("direct_merge");
    expect(reviewPending.state_id).toBe("review_pending");
    expect(reviewing.state_id).toBe("reviewing");
    expect(released.state_id).toBe("released");
  });

  it("walks the preview-release path through acceptance", () => {
    const reviewing = transitionTaskMachine(
      transitionTaskMachine(
        transitionTaskMachine(
          transitionTaskMachine(createInitialTaskMachine(), "plan_approved"),
          "preflight_passed",
          { change_class: "release" }
        ),
        "handoff_created"
      ),
      "review_started"
    );
    const releasePreparing = transitionTaskMachine(reviewing, "review_passed", { delivery_track: "preview_release" });
    const acceptancePending = transitionTaskMachine(releasePreparing, "release_prepared");
    const released = transitionTaskMachine(acceptancePending, "acceptance_accepted");

    expect(releasePreparing.state_id).toBe("release_preparing");
    expect(acceptancePending.state_id).toBe("acceptance_pending");
    expect(released.state_id).toBe("released");
    expect(released.delivery_track).toBe("preview_release");
  });

  it("requires reason for override transitions and preserves blocked resume metadata", () => {
    expect(() =>
      transitionTaskMachine(createInitialTaskMachine(), "block")
    ).toThrow(/requires reason/i);

    const blocked = transitionTaskMachine(
      transitionTaskMachine(createInitialTaskMachine(), "plan_approved"),
      "block",
      { reason: "等待外部依赖" }
    );
    const resumed = transitionTaskMachine(blocked, "resume", { reason: "依赖已满足" });

    expect(blocked.state_id).toBe("blocked");
    expect(blocked.blocked_reason).toBe("等待外部依赖");
    expect(blocked.resume_to_state).toBe("ready");
    expect(resumed.state_id).toBe("ready");
  });

  it("routes acceptance rejection back to execution via blocked state", () => {
    const blocked = transitionTaskMachine(
      transitionTaskMachine(
        transitionTaskMachine(
          transitionTaskMachine(
            transitionTaskMachine(createInitialTaskMachine(), "plan_approved"),
            "preflight_passed",
            { delivery_track: "preview_release" }
          ),
          "handoff_created"
        ),
        "review_started"
      ),
      "review_passed",
      { delivery_track: "preview_release" }
    );
    const acceptancePending = transitionTaskMachine(blocked, "release_prepared");
    const rejected = transitionTaskMachine(acceptancePending, "acceptance_rejected", { reason: "验收未通过" });
    const resumed = transitionTaskMachine(rejected, "resume", { reason: "返回执行修复" });

    expect(rejected.state_id).toBe("blocked");
    expect(rejected.resume_to_state).toBe("executing");
    expect(rejected.blocked_reason).toBe("验收未通过");
    expect(resumed.state_id).toBe("executing");
  });
});
