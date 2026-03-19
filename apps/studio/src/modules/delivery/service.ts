import { getReleaseDashboard } from "@/modules/releases";
import { buildTaskDeliveryRows, listTaskCards } from "@/modules/tasks";
import { collectDiffAwareArtifact } from "./diff-aware";
import type { DeliverySnapshot } from "./types";

export async function getDeliverySnapshot(): Promise<DeliverySnapshot> {
  const [taskCards, releaseDashboard] = await Promise.all([listTaskCards(), getReleaseDashboard()]);

  return {
    taskCards,
    taskRows: buildTaskDeliveryRows(taskCards, releaseDashboard.releases),
    releaseDashboard,
    diffAware: collectDiffAwareArtifact(),
  };
}
