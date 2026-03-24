import type { ReleaseRecord } from "@/modules/releases/types";
import { findEffectivePendingDevRelease } from "../../../../../shared/release-registry";
import type { TaskCard, TaskDeliveryRow, TaskDeliveryStatus } from "./types";

export const TASK_DELIVERY_LABELS: Record<TaskDeliveryStatus, string> = {
  not_started: "待开始",
  in_progress: "进行中",
  pending_acceptance: "待验收",
  released: "已发布",
  rolled_back: "已回滚",
  blocked: "已阻塞",
};

export function buildTaskDeliveryRows(tasks: TaskCard[], releases: ReleaseRecord[]): TaskDeliveryRow[] {
  return [...tasks]
    .map((task) => buildTaskDeliveryRow(task, releases))
    .sort((left, right) => {
      const statusDelta = deliveryOrder(left.deliveryStatus) - deliveryOrder(right.deliveryStatus);
      if (statusDelta !== 0) {
        return statusDelta;
      }
      return `${left.shortId} ${left.title}`.localeCompare(`${right.shortId} ${right.title}`, "zh-CN");
    });
}

function buildTaskDeliveryRow(task: TaskCard, releases: ReleaseRecord[]): TaskDeliveryRow {
  const associated = releases
    .filter((release) => matchesTask(task, release))
    .sort((left, right) => sortStamp(right).localeCompare(sortStamp(left)));
  const pendingDev = findEffectivePendingDevRelease(associated);
  const prodReleases = associated.filter((release) => release.channel === "prod" && release.acceptance_status === "accepted");
  const activeProd = prodReleases.find((release) => release.status === "active") ?? null;
  const latestProd = prodReleases[0] ?? null;
  const rollbackCandidate = prodReleases.find((release) => release.release_id !== activeProd?.release_id) ?? null;
  const deliveryStatus = resolveDeliveryStatus(task, pendingDev, activeProd, latestProd);
  const inferredReleaseLabel = inferReleaseLabel(task, pendingDev, activeProd, latestProd);

  return {
    ...task,
    deliveryStatus,
    versionLabel: inferredReleaseLabel,
    acceptReleaseId: pendingDev?.primary_task_id === task.id ? pendingDev.release_id : null,
    rollbackReleaseId: rollbackCandidate?.release_id || null,
    linkedTaskIds: associated.flatMap((release) => release.linked_task_ids).filter(unique),
  };
}

function matchesTask(task: TaskCard, release: ReleaseRecord) {
  if (release.primary_task_id === task.id || release.linked_task_ids.includes(task.id)) {
    return true;
  }
  return explicitReleaseRefs(task).includes(release.release_id);
}

function resolveDeliveryStatus(
  task: TaskCard,
  pendingDev: ReleaseRecord | null,
  activeProd: ReleaseRecord | null,
  latestProd: ReleaseRecord | null,
): TaskDeliveryStatus {
  if (task.status === "blocked") {
    return "blocked";
  }
  if (pendingDev?.primary_task_id === task.id) {
    return "pending_acceptance";
  }
  if (task.status === "done" && latestProd?.status === "rolled_back") {
    return "rolled_back";
  }
  if (task.status === "done" && (activeProd || latestProd || task.machine.git.state === "merged")) {
    return "released";
  }
  if (task.status === "doing") {
    return "in_progress";
  }
  return "not_started";
}

function inferReleaseLabel(
  task: TaskCard,
  pendingDev: ReleaseRecord | null,
  activeProd: ReleaseRecord | null,
  latestProd: ReleaseRecord | null,
) {
  if (pendingDev?.release_id) {
    return pendingDev.release_id;
  }
  if (activeProd?.release_id) {
    return activeProd.release_id;
  }
  if (latestProd?.release_id) {
    return latestProd.release_id;
  }
  if (task.machine.companionLatestRelease) {
    return task.machine.companionLatestRelease;
  }
  if (task.machine.primaryRelease && task.machine.primaryRelease !== "未生成") {
    return task.machine.primaryRelease;
  }
  const linkedRelease = task.machine.linkedReleases.find((value) => Boolean(value) && value !== "无");
  if (linkedRelease) {
    return linkedRelease;
  }
  const commit = sanitizeCommit(task.machine.git.recentCommit || task.machine.recentCommit);
  if (task.status === "done" && task.machine.git.state === "merged" && commit) {
    return `main@${commit}`;
  }
  if (task.status === "done" && task.machine.git.state === "merged") {
    return "main@history";
  }
  return "未生成";
}

function explicitReleaseRefs(task: TaskCard) {
  return Array.from(
    new Set(
      [task.machine.primaryRelease, ...task.machine.linkedReleases, ...task.machine.companionReleaseIds]
        .map((value) => String(value || "").trim())
        .filter((value) => Boolean(value) && value !== "未生成" && value !== "无")
    )
  );
}

function deliveryOrder(status: TaskDeliveryStatus) {
  const order: TaskDeliveryStatus[] = ["pending_acceptance", "in_progress", "blocked", "not_started", "released", "rolled_back"];
  return order.indexOf(status);
}

function sortStamp(release: ReleaseRecord) {
  return release.cutover_at || release.created_at;
}

function unique(value: string, index: number, values: string[]) {
  return Boolean(value) && values.indexOf(value) === index;
}

function sanitizeCommit(value: string) {
  const normalized = String(value || "").replace(/`/g, "").trim();
  if (!normalized || normalized.toLowerCase().startsWith("auto:") || normalized.toLowerCase() === "pending") {
    return "";
  }
  return normalized;
}
