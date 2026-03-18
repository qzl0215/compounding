import type { ReleaseDashboard } from "@/modules/releases";
import type { TaskCard, TaskDeliveryRow } from "@/modules/tasks";

export type DeliverySnapshot = {
  taskCards: TaskCard[];
  taskRows: TaskDeliveryRow[];
  releaseDashboard: ReleaseDashboard;
};
