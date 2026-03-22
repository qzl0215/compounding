import type { TaskDeliveryRow } from "@/modules/tasks";
import type { DemandStage } from "./types";

const PLANNING_MODES = new Set(["战略澄清", "方案评审"]);
const EXECUTION_MODES = new Set(["工程执行", "发布复盘"]);

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
  if (row.deliveryStatus === "pending_acceptance") {
    return "acceptance";
  }
  if (row.deliveryStatus === "released" || row.deliveryStatus === "rolled_back") {
    return "released";
  }
  if (row.status === "doing" || row.status === "blocked") {
    return "doing";
  }
  if (isPlanningMode(row.currentMode)) {
    return "planning";
  }
  if (row.status === "todo" && isExecutionMode(row.currentMode)) {
    return "ready";
  }
  if (row.status === "todo") {
    return "ready";
  }
  return "released";
}

function isPlanningMode(value: string) {
  return PLANNING_MODES.has(normalizeMode(value));
}

function isExecutionMode(value: string) {
  return EXECUTION_MODES.has(normalizeMode(value));
}

function normalizeMode(value: string) {
  return String(value || "").trim();
}
