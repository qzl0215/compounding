import { listDocsUnder, readDoc } from "@/modules/docs";
import { readTaskCompanionFacts } from "./companion";
import { resolveTaskGitInfo } from "./git";
import { parseTaskCard, parseTaskMachineFields } from "./parsing";
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
      const parsedMachine = parseTaskMachineFields(taskPath, docs[index].content);
      const companion = readTaskCompanionFacts(parsed.id);
      const branch = parsedMachine.branch || companion.branch;
      const recentCommit = parsedMachine.recentCommit || companion.recentCommit;
      const currentMode = normalizeExecutionMode(
        companion.currentMode || parsedMachine.currentMode || defaultModeForStatus(parsed.status),
        parsed.status
      );
      return {
        ...parsed,
        currentMode,
        machine: {
          contractHash: companion.contractHash,
          branch,
          recentCommit,
          completionMode: companion.completionMode,
          primaryRelease: parsedMachine.primaryRelease || companion.latestReleaseId || "未生成",
          linkedReleases: uniqueStrings([...parsedMachine.linkedReleases, ...companion.releaseIds]),
          companionReleaseIds: companion.releaseIds,
          companionLatestRelease: companion.latestReleaseId,
          relatedModules: mergeMachineModules(taskPath, parsedMachine.relatedModules, companion.plannedFiles, companion.plannedModules),
          updateTrace: parsedMachine.updateTrace,
          locks: companion.locks,
          artifactRefs: companion.artifactRefs,
          latestSearchEvidence: companion.latestSearchEvidence,
          git: resolveTaskGitInfo(parsed.status, branch, recentCommit),
        },
      };
    })
    .sort((left, right) => TASK_STATUS_ORDER.indexOf(left.status) - TASK_STATUS_ORDER.indexOf(right.status) || left.path.localeCompare(right.path));

  assertUniqueTaskIdentities(taskCards.map((task) => ({ id: task.id, shortId: task.shortId, path: task.path })));
  return taskCards;
}

function mergeMachineModules(taskPath: string, relatedModules: string[], plannedFiles: string[], plannedModules: string[]) {
  return uniqueStrings(
    [...relatedModules, ...plannedFiles.filter((item) => item !== taskPath), ...plannedModules].filter(Boolean)
  );
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function defaultModeForStatus(status: TaskStatus) {
  return status === "done" ? "质量验收" : "工程执行";
}

function normalizeExecutionMode(currentMode: string, status: TaskStatus) {
  const normalized = String(currentMode || "").trim();
  if (normalized === "战略澄清" || normalized === "方案评审") {
    return status === "done" ? "质量验收" : "工程执行";
  }
  return normalized || defaultModeForStatus(status);
}
