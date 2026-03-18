import { getReleaseDashboard } from "@/modules/releases";
import { buildTaskDeliveryRows, groupTaskCardsByStatus, listTaskCards } from "@/modules/tasks";
import type { DeliverySnapshot } from "./types";

export async function getDeliverySnapshot(): Promise<DeliverySnapshot> {
  const [taskCards, releaseDashboard] = await Promise.all([listTaskCards(), getReleaseDashboard()]);

  return {
    taskCards,
    taskGroups: groupTaskCardsByStatus(taskCards),
    taskRows: buildTaskDeliveryRows(taskCards, releaseDashboard.releases),
    releaseDashboard,
  };
}
