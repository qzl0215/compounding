import type { ReleaseTaskOption } from "@/modules/releases";
import { buildTaskDeliveryRows } from "@/modules/tasks";
import type { ReleaseDashboard } from "@/modules/releases";
import type { TaskCard, TaskDeliveryRow } from "@/modules/tasks";

export function buildTaskRowsProjection(taskCards: TaskCard[], releaseDashboard: ReleaseDashboard): TaskDeliveryRow[] {
  return buildTaskDeliveryRows(taskCards, releaseDashboard.releases);
}

export function buildTaskOptionsProjection(taskRows: TaskDeliveryRow[]): ReleaseTaskOption[] {
  return taskRows
    .filter((task) => task.status !== "done")
    .map((task) => ({ id: task.id, label: `${task.shortId || task.id} ${task.title}`.trim() }));
}
