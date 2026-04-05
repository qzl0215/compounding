import type { TaskDeliveryRow } from "@/modules/tasks";
import { normalizeInline } from "./parsing";
import { DEMAND_STAGE_ACTIONS, DEMAND_STAGE_LABELS, resolveTaskDemandStage } from "./stage-model";
import type { DemandStage, DemandStageItem } from "./types";

export function buildDocItems({
  values,
  stage,
  source,
  evidenceHref,
  actions = [],
}: {
  values: string[];
  stage: DemandStage;
  source: string;
  evidenceHref: string;
  actions?: string[];
}): DemandStageItem[] {
  return values.map((value, index) => {
    const { title, summary } = splitItemText(value);
    return {
      id: `${stage}-${index}-${title}`,
      title,
      source,
      stage,
      summary,
      nextConversationAction: actions[index] || DEMAND_STAGE_ACTIONS[stage],
      evidenceHref,
    };
  });
}

export function buildTaskItem(row: TaskDeliveryRow): DemandStageItem {
  const stage = resolveTaskDemandStage(row);
  return {
    id: row.id,
    taskId: row.id,
    title: `${row.shortId || row.id} ${row.title}`.trim(),
    source: row.machine.stateLabel || row.machine.modeLabel || "task",
    stage,
    summary: summarizeTaskRow(row, stage),
    nextConversationAction: DEMAND_STAGE_ACTIONS[stage],
    evidenceHref: `/knowledge-base?path=${encodeURIComponent(row.path)}`,
    badge: stage === "acceptance" ? row.versionLabel : undefined,
  };
}

export function buildAcceptanceReleaseItems(releaseId: string | null): DemandStageItem[] {
  if (!releaseId) {
    return [];
  }
  return [
    {
      id: `acceptance-release-${releaseId}`,
      title: `${releaseId} 待验收`,
      source: "发布",
      stage: "acceptance",
      summary: "当前已经有待验收版本，先做通过/驳回判断，再继续推进新改动。",
      nextConversationAction: DEMAND_STAGE_ACTIONS.acceptance,
      evidenceHref: "/releases",
      badge: DEMAND_STAGE_LABELS.acceptance,
    },
  ];
}

export function buildReleasedItems(items: TaskDeliveryRow[], activeReleaseId: string | null) {
  const released = items.slice(0, 2).map((row) => buildTaskItem(row));
  if (activeReleaseId) {
    released.unshift({
      id: `active-release-${activeReleaseId}`,
      title: `Production 当前版本 ${activeReleaseId}`,
      source: "发布",
      stage: "released",
      summary: "当前线上已经有激活版本，后续动作先看复盘与下一轮方向，不要直接把 released 当成待执行。",
      nextConversationAction: DEMAND_STAGE_ACTIONS.released,
      evidenceHref: "/releases",
      badge: DEMAND_STAGE_LABELS.released,
    });
  }
  return dedupeById(released);
}

export function dedupeItems(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function summarizeTaskRow(row: TaskDeliveryRow, stage: DemandStage) {
  if (stage === "planning") {
    return row.boundary || row.summary;
  }
  if (stage === "ready") {
    return `${row.doneWhen || row.summary} 已具备执行边界，可以进入 task 推进。`;
  }
  if (stage === "doing") {
    if (row.status === "blocked") {
      return `${row.risk || row.summary} 当前处于阻塞，需要先清掉依赖或边界问题。`;
    }
    return `${row.doneWhen || row.summary} 当前正在推进，优先看风险和下一步。`;
  }
  if (stage === "acceptance") {
    return `当前版本 ${row.versionLabel} 待验收。${row.risk || "先判断结果是否通过。"}`;
  }
  if (stage === "released") {
    return `已发布到 ${row.versionLabel}。${row.retro || row.deliveryResult || "下一步先看复盘与影响。"}`;
  }
  return row.summary;
}

function splitItemText(value: string) {
  const normalized = normalizeInline(value);
  const match = normalized.match(/^([^：:]+)[：:]\s*(.+)$/);
  if (!match) {
    return {
      title: normalized,
      summary: normalized,
    };
  }
  return {
    title: match[1].trim(),
    summary: match[2].trim(),
  };
}

function dedupeById<T extends { id: string }>(values: T[]) {
  return values.filter((value, index) => values.findIndex((item) => item.id === value.id) === index);
}
