import { getHarnessLiveSnapshot } from "@/modules/harness";
import { getReleaseDashboard } from "@/modules/releases";
import { listTaskCards } from "@/modules/tasks";
import { collectDiffAwareArtifact } from "./diff-aware";
import { buildTaskOptionsProjection, buildTaskRowsProjection } from "./projections";
import type { DeliverySnapshot } from "./types";

export async function getDeliverySnapshot(): Promise<DeliverySnapshot> {
  const [taskCards, releaseDashboard, harness] = await Promise.all([listTaskCards(), getReleaseDashboard(), getHarnessLiveSnapshot()]);
  const taskRows = buildTaskRowsProjection(taskCards, releaseDashboard);
  const diffAware = collectDiffAwareArtifact();

  return {
    facts: {
      harness,
      taskCards,
      releaseDashboard,
      diffAware,
    },
    projections: {
      taskRows,
      taskOptions: buildTaskOptionsProjection(taskRows),
    },
  };
}
