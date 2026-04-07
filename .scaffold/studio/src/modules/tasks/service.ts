import { listDocsUnder, readDoc } from "@/modules/docs";
import { readTaskCompanionFacts } from "./companion";
import { resolveTaskGitInfo } from "./git";
import { parseTaskCard, parseTaskMachineFields } from "./parsing";
import type { TaskCard, TaskGroup, TaskStatus } from "./types";
import { assertUniqueTaskIdentities } from "../../../../../shared/task-identity";
import { deriveCompatTaskMachine, deriveTaskStatusFromStateId, getTaskModeLabel, getTaskStateLabel } from "../../../../../shared/task-state-machine";

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
      const fallbackMachine = !companion.contractHash
        ? deriveCompatTaskMachine({
            task_status: parsed.status,
            delivery_track: parsedMachine.deliveryTrack,
          })
        : null;
      const machineState = fallbackMachine || {
        state_id: companion.stateId,
        mode_id: companion.modeId,
        delivery_track: companion.deliveryTrack,
        blocked_from_state: companion.blockedFromState,
        resume_to_state: companion.resumeToState,
        blocked_reason: companion.blockedReason,
        last_transition: companion.lastTransitionEvent ? { event_id: companion.lastTransitionEvent } : null,
      };
      const branch = parsedMachine.branch || companion.branch;
      const recentCommit = parsedMachine.recentCommit || companion.recentCommit;
      const derivedStatus = deriveTaskStatusFromStateId(machineState.state_id);
      return {
        ...parsed,
        status: derivedStatus as TaskStatus,
        machine: {
          contractHash: companion.contractHash,
          stateId: machineState.state_id,
          stateLabel: fallbackMachine ? getTaskStateLabel(machineState.state_id) : companion.stateLabel,
          modeId: machineState.mode_id,
          modeLabel: fallbackMachine ? getTaskModeLabel(machineState.mode_id) : companion.modeLabel,
          deliveryTrack: machineState.delivery_track,
          blockedFromState: machineState.blocked_from_state,
          resumeToState: machineState.resume_to_state,
          blockedReason: machineState.blocked_reason || "",
          lastTransitionEvent: fallbackMachine ? null : companion.lastTransitionEvent,
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
          branchCleanup: companion.branchCleanup,
          git: resolveTaskGitInfo(derivedStatus as TaskStatus, branch, recentCommit, companion.branchCleanup),
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
