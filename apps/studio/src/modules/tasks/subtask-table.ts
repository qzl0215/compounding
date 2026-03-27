import type { DemandStage } from "@/modules/portal";
import { resolveTaskDemandStage } from "@/modules/portal/stage-model";
import type { TaskDeliveryRow } from "./types";

const STAGE_ORDER: DemandStage[] = ["acceptance", "doing", "ready", "planning", "released"];

export function buildSubtaskTableRows(rows: TaskDeliveryRow[]) {
  return [...rows]
    .filter((row) => resolveTaskDemandStage(row) !== "released")
    .sort((left, right) => {
      const stageDelta = STAGE_ORDER.indexOf(resolveTaskDemandStage(left)) - STAGE_ORDER.indexOf(resolveTaskDemandStage(right));
      if (stageDelta !== 0) {
        return stageDelta;
      }

      const shortIdDelta = parseShortId(left.shortId) - parseShortId(right.shortId);
      if (shortIdDelta !== 0) {
        return shortIdDelta;
      }

      return left.title.localeCompare(right.title, "zh-CN");
    });
}

function parseShortId(value: string) {
  const match = String(value || "").match(/^t-(\d+)$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}
