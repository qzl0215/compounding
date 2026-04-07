import { createRequire } from "node:module";
import type { TaskCostLedger, TaskCostSnapshot } from "../../../shared/task-cost";

type TaskCostInput = {
  taskId?: string | null;
  title?: string | null;
  deliveryStatus?: string | null;
  versionLabel?: string | null;
  task?: Record<string, unknown> | null;
  companion?: Record<string, unknown> | null;
  associatedReleases?: Array<Record<string, unknown>>;
};

type TaskCostReport = {
  ok: boolean;
  task_id: string;
  title: string;
  ledger: TaskCostLedger;
};

const require = createRequire(import.meta.url);
const taskCostCore = require("./task-cost-core.ts") as {
  buildTaskCostLedger: (root?: string, input?: TaskCostInput) => TaskCostLedger;
  buildTaskCostReport: (root?: string, input?: TaskCostInput) => TaskCostReport;
  buildTaskCostLedgers: (root?: string, items?: Array<Record<string, unknown>>) => TaskCostLedger[];
  formatTaskCostReportText: (payload?: TaskCostReport | TaskCostLedger) => string;
  buildTaskCostSnapshot: (root?: string, input?: TaskCostInput) => TaskCostSnapshot | null;
};

export const buildTaskCostLedger = taskCostCore.buildTaskCostLedger;
export const buildTaskCostReport = taskCostCore.buildTaskCostReport;
export const buildTaskCostLedgers = taskCostCore.buildTaskCostLedgers;
export const formatTaskCostReportText = taskCostCore.formatTaskCostReportText;
export const buildTaskCostSnapshot = taskCostCore.buildTaskCostSnapshot;
