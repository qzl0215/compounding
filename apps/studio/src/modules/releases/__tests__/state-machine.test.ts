import { describe, expect, it } from "vitest";
import { getReleaseStateLabel, transitionReleaseState } from "../../../../../../shared/release-state-machine";

describe("release state machine", () => {
  it("derives canonical labels and transitions prepared -> preview -> active", () => {
    expect(getReleaseStateLabel("preview")).toBe("预览中");

    const prepared = transitionReleaseState(null, "prepare_release", {
      channel: "dev",
      recorded_at: "2026-04-05T10:00:00Z",
    });
    expect(prepared.state_id).toBe("prepared");

    const preview = transitionReleaseState(prepared, "publish_preview", {
      recorded_at: "2026-04-05T10:01:00Z",
    });
    expect(preview.state_id).toBe("preview");

    const active = transitionReleaseState(preview, "promote_release", {
      recorded_at: "2026-04-05T10:02:00Z",
    });
    expect(active.state_id).toBe("active");
  });
});
