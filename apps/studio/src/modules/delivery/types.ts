import type { ReleaseDashboard } from "@/modules/releases";
import type { TaskCard, TaskDeliveryRow, TaskGroup } from "@/modules/tasks";

export type DeliverySnapshot = {
  taskCards: TaskCard[];
  taskGroups: TaskGroup[];
  taskRows: TaskDeliveryRow[];
  releaseDashboard: ReleaseDashboard;
};
