import { getReleaseDashboard } from "@/modules/releases";
import { listTaskCards } from "@/modules/tasks";
import { collectDiffAwareArtifact } from "./diff-aware";
import { buildTaskOptionsProjection, buildTaskRowsProjection } from "./projections";
import type { DeliverySnapshot } from "./types";

export async function getDeliverySnapshot(): Promise<DeliverySnapshot> {
  const [taskCards, releaseDashboard] = await Promise.all([listTaskCards(), getReleaseDashboard()]);
  const taskRows = buildTaskRowsProjection(taskCards, releaseDashboard);

  return {
    taskRows,
    taskOptions: buildTaskOptionsProjection(taskRows),
    releaseDashboard,
    diffAware: collectDiffAwareArtifact(),
  };
}
