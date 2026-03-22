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
  thinking: "现在不是该开工的时候",
  planning: "现在该先把边界说清",
  ready: "现在可以进 task",
  doing: "现在该围绕交付推进",
  acceptance: "现在该验收，不该继续堆改动",
  released: "现在该看复盘与后续影响",
};

export const DEMAND_STAGE_ACTIONS: Record<DemandStage, string> = {
  thinking: "先问问题是什么、为什么现在、成功算什么、不做会怎样。",
  planning: "先问范围、范围外、取舍、优先级和验收标准。",
  ready: "先确认 task 边界、约束和验收标准，再进入执行。",
  doing: "先看阻塞、风险和下一步动作，不再回到模糊讨论。",
  acceptance: "先完成验收判断，再决定是否继续推进或发布。",
  released: "先复盘结果和后续影响，再决定下一轮动作。",
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
