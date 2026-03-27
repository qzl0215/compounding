import type { TaskDeliveryRow } from "@/modules/tasks";
import { deriveDemandStageFromStateId } from "../../../../../shared/task-state-machine";
import type { DemandStage } from "./types";

export const DEMAND_STAGE_LABELS: Record<DemandStage, string> = {
  thinking: "待思考",
  planning: "待规划",
  ready: "待执行",
  doing: "执行中",
  acceptance: "待验收",
  released: "已发布",
};

export const DEMAND_STAGE_HINTS: Record<DemandStage, string> = {
  thinking: "先定义问题，不开工",
  planning: "先收口边界，再定方案",
  ready: "现在可以进 task",
  doing: "先围绕交付推进",
  acceptance: "先完成验收",
  released: "先看复盘与影响",
};

export const DEMAND_STAGE_ACTIONS: Record<DemandStage, string> = {
  thinking: "先补问题、时机和成功标准。",
  planning: "先定范围外、取舍和验收标准。",
  ready: "确认边界后进入 task。",
  doing: "先处理阻塞和下一步。",
  acceptance: "先做通过或驳回判断。",
  released: "先看复盘，再定后续。",
};

export function groupTaskRowsByDemandStage(rows: TaskDeliveryRow[]) {
  return rows.reduce(
    (buckets, row) => {
      const stage = resolveTaskDemandStage(row);
      buckets[stage].push(row);
      return buckets;
    },
    {
      thinking: [] as TaskDeliveryRow[],
      planning: [] as TaskDeliveryRow[],
      ready: [] as TaskDeliveryRow[],
      doing: [] as TaskDeliveryRow[],
      acceptance: [] as TaskDeliveryRow[],
      released: [] as TaskDeliveryRow[],
    }
  );
}

export function resolveTaskDemandStage(row: TaskDeliveryRow): DemandStage {
  return deriveDemandStageFromStateId(row.machine.stateId);
}
