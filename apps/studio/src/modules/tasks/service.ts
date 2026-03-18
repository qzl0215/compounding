import { listDocsUnder, readDoc } from "@/modules/docs";
import { resolveTaskGitInfo } from "./git";
import { parseTaskCard } from "./parsing";
import type { TaskCard, TaskGroup, TaskStatus } from "./types";

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

  return taskPaths
    .map((taskPath, index) => {
      const parsed = parseTaskCard(taskPath, docs[index].content);
      return {
        ...parsed,
        git: resolveTaskGitInfo(parsed.status, parsed.branch, parsed.recentCommit),
      };
    })
    .sort((left, right) => TASK_STATUS_ORDER.indexOf(left.status) - TASK_STATUS_ORDER.indexOf(right.status) || left.path.localeCompare(right.path));
}
