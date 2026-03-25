import { describe, expect, it } from "vitest";
import { getDeliverySnapshot } from "../service";

describe("delivery snapshot", () => {
  it("builds a shared read model for tasks, releases and runtime state", async () => {
    const snapshot = await getDeliverySnapshot();

    expect(snapshot.facts.taskCards.length).toBeGreaterThan(0);
    expect(snapshot.projections.taskRows.length).toBeGreaterThan(0);
    expect(snapshot.projections.taskOptions.every((option) => snapshot.projections.taskRows.some((task) => task.id === option.id && task.status !== "done"))).toBe(true);
    expect(snapshot.facts.releaseDashboard.releases.length).toBeGreaterThan(0);
    expect(snapshot.facts.diffAware.summary.length).toBeGreaterThan(0);
    expect(snapshot.facts.diffAware.selectedChecks.required.every((layer) => layer.reason.length > 0)).toBe(true);
    expect(snapshot.facts.releaseDashboard.active_release_id || snapshot.facts.releaseDashboard.pending_dev_release || snapshot.facts.releaseDashboard.local_runtime).toBeTruthy();
  }, 15000);
});
