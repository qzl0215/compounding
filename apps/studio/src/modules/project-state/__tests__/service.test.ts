import { describe, expect, it } from "vitest";
import { getDeliverySnapshot } from "@/modules/delivery";
import { getProjectStateSnapshot } from "../service";

const SERVICE_TIMEOUT_MS = 30000;

describe("project state snapshot", () => {
  it("shares the same phase and release attention across home, tasks, and releases", async () => {
    const deliverySnapshot = await getDeliverySnapshot();
    const snapshot = await getProjectStateSnapshot({ deliverySnapshot });

    expect(snapshot.identity.name).toContain("Compounding");
    expect(snapshot.headline.currentMilestone.length).toBeGreaterThan(0);
    expect(snapshot.focus.summary.length).toBeGreaterThan(0);
    expect(snapshot.execution.counts.total).toBe(deliverySnapshot.projections.taskRows.length);
    expect(["thinking", "planning", "ready", "doing", "acceptance", "released"]).toContain(snapshot.activeStage);
    expect(snapshot.judgement.overallSummary).toBe(snapshot.headline.overallSummary);
    expect(snapshot.judgement.focusSummary).toBe(snapshot.focus.summary);
    expect(snapshot.judgement.nextAction).toBe(snapshot.release.nextAction);
    expect(snapshot.aiEfficiency.dashboard.overview.summary_runs).toBeGreaterThanOrEqual(0);
    expect(snapshot.aiEfficiency.dashboard.consumption.top_profiles_by_input.length).toBeGreaterThanOrEqual(0);
    expect(snapshot.aiEfficiency.dashboard.coverage.supported_profiles.length).toBeGreaterThan(0);
    expect(snapshot.aiEfficiency.dashboard.trend_delta.last_7d_input).toBeGreaterThanOrEqual(0);
    expect(snapshot.aiEfficiency.dashboard.task_rollups.length).toBeGreaterThanOrEqual(0);
  }, SERVICE_TIMEOUT_MS);

  it("keeps release conclusion aligned with pending acceptance and runtime state", async () => {
    const snapshot = await getProjectStateSnapshot();

    if (snapshot.release.pendingAcceptance) {
      expect(snapshot.release.conclusion).toContain("验收");
      expect(snapshot.release.nextAction).toContain("先验收");
    } else if (snapshot.focus.blockers.length > 0) {
      expect(snapshot.release.healthSummary).toContain("阻塞");
    } else if (snapshot.release.runtimeAlert) {
      expect(snapshot.release.healthSummary).toContain("异常");
    } else {
      expect(snapshot.release.healthSummary).toContain("运行正常");
    }

    expect(snapshot.judgement.recommendedSurface.href.startsWith("/")).toBe(true);
    expect(snapshot.judgement.recommendedRead.path.endsWith(".md")).toBe(true);
    expect(snapshot.aiEfficiency.dashboard.health.raw_trace_rate_pct).toBeGreaterThanOrEqual(0);
  }, SERVICE_TIMEOUT_MS);
});
