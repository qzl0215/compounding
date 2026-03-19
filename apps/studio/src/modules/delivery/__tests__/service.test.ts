import { describe, expect, it } from "vitest";
import { getDeliverySnapshot } from "../service";

describe("delivery snapshot", () => {
  it("builds a shared read model for tasks, releases and runtime state", async () => {
    const snapshot = await getDeliverySnapshot();

    expect(snapshot.taskCards.length).toBeGreaterThan(0);
    expect(snapshot.taskRows).toHaveLength(snapshot.taskCards.length);
    expect(snapshot.releaseDashboard.releases.length).toBeGreaterThan(0);
    expect(snapshot.diffAware.summary.length).toBeGreaterThan(0);
    expect(snapshot.releaseDashboard.active_release_id || snapshot.releaseDashboard.pending_dev_release || snapshot.releaseDashboard.local_runtime).toBeTruthy();
  });
});
