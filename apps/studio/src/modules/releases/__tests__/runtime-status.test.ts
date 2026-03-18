import { describe, expect, it } from "vitest";
import { getRuntimeStatusExplanation } from "../runtime-status";

describe("runtime status explanation", () => {
  it("returns human label, explanation and next step for each status", () => {
    expect(getRuntimeStatusExplanation("running").humanLabel).toBe("运行中");
    expect(getRuntimeStatusExplanation("stopped").humanLabel).toBe("未启动");
    expect(getRuntimeStatusExplanation("stale_pid").humanLabel).toBe("进程失效");
    expect(getRuntimeStatusExplanation("port_error").humanLabel).toBe("端口异常");
    expect(getRuntimeStatusExplanation("drift").humanLabel).toBe("版本漂移");
    expect(getRuntimeStatusExplanation("unmanaged").humanLabel).toBe("未托管占用");
  });

  it("includes next step for non-running statuses", () => {
    const stopped = getRuntimeStatusExplanation("stopped");
    expect(stopped.nextStep).toContain("发布页");
    expect(stopped.nextStep).toContain("启动");

    const portError = getRuntimeStatusExplanation("port_error");
    expect(portError.nextStep).toContain("发布页");
  });

  it("uses tone danger for port_error and unmanaged", () => {
    expect(getRuntimeStatusExplanation("port_error").tone).toBe("danger");
    expect(getRuntimeStatusExplanation("unmanaged").tone).toBe("danger");
  });

  it("enriches explanation with runtime context when provided", () => {
    const exp = getRuntimeStatusExplanation("running", "production", {
      status: "running",
      running: true,
      port: 3010,
      pid: 123,
      runtime_release_id: "20260317-abc-prod",
      current_release_id: "20260317-abc-prod",
      drift: false,
      reason: "",
      log_path: "",
      state_path: "",
    });
    expect(exp.explanation).toContain("20260317-abc-prod");
  });
});
