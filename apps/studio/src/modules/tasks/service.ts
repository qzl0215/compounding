import { listDocsUnder, readDoc } from "@/modules/docs";
import { readTaskCompanionReleaseInfo } from "./companion";
import { resolveTaskGitInfo } from "./git";
import { parseTaskCard } from "./parsing";
import type { TaskCard, TaskGroup, TaskStatus } from "./types";
import { assertUniqueTaskIdentities } from "../../../../../shared/task-identity";

export const TASK_STATUS_ORDER: TaskStatus[] = ["todo", "doing", "blocked", "done"];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "待开始",
  doing: "进行中",
  blocked: "阻塞中",
  done: "已完成",
};

export async function getTaskBoard(): Promise<TaskGroup[]> {
  const taskCards = await listTaskCards();
  return groupTaskCardsByStatus(taskCards);
}

export function groupTaskCardsByStatus(taskCards: TaskCard[]): TaskGroup[] {
  return TASK_STATUS_ORDER.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    tasks: taskCards.filter((task) => task.status === status),
  }));
}

export async function listTaskCards(): Promise<TaskCard[]> {
  const taskPaths = await listDocsUnder("tasks/queue");
  const docs = await Promise.all(taskPaths.map((path) => readDoc(path)));
  const taskCards = taskPaths
    .map((taskPath, index) => {
      const parsed = parseTaskCard(taskPath, docs[index].content);
      const companion = readTaskCompanionReleaseInfo(parsed.id);
      return {
        ...parsed,
        companionReleaseIds: companion.releaseIds,
        companionLatestRelease: companion.latestReleaseId,
        git: resolveTaskGitInfo(parsed.status, parsed.branch, parsed.recentCommit),
      };
    })
    .sort((left, right) => TASK_STATUS_ORDER.indexOf(left.status) - TASK_STATUS_ORDER.indexOf(right.status) || left.path.localeCompare(right.path));

  assertUniqueTaskIdentities(taskCards.map((task) => ({ id: task.id, shortId: task.shortId, path: task.path })));
  return taskCards;
}
