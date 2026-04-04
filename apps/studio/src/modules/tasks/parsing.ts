import { parseTaskContract, parseTaskMachineFacts } from "../../../../../shared/task-contract";
import type { TaskContract, TaskStatus } from "./types";

export function parseTaskCard(path: string, content: string): TaskContract {
  const parsed = parseTaskContract(path, content);

  return {
    id: parsed.id,
    path: parsed.path,
    shortId: parsed.shortId,
    title: parsed.title,
    status: normalizeTaskStatus(parsed.status),
    parentPlan: parsed.parentPlan,
    summary: parsed.summary,
    whyNow: parsed.whyNow,
    boundary: parsed.boundary,
    doneWhen: parsed.doneWhen,
    linkedGap: parsed.linkedGap,
    fromAssertion: parsed.fromAssertion,
    writebackTargets: parsed.writebackTargets,
    inScope: parsed.inScope,
    outOfScope: parsed.outOfScope,
    constraints: parsed.constraints,
    risk: parsed.risk,
    testStrategy: parsed.testStrategy,
    acceptanceResult: parsed.acceptanceResult,
    deliveryResult: parsed.deliveryResult,
    retro: parsed.retro,
  };
}

export function parseTaskMachineFields(_path: string, content: string) {
  const parsed = parseTaskMachineFacts(content);
  return {
    currentMode: parsed.currentMode,
    deliveryTrack: parsed.deliveryTrack,
    branch: parsed.branch,
    recentCommit: parsed.recentCommit,
    primaryRelease: parsed.primaryRelease || "未生成",
    linkedReleases: parsed.linkedReleases,
    relatedModules: parsed.relatedModules,
    updateTrace: parsed.updateTrace,
  };
}

function normalizeTaskStatus(value: string): TaskStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === "in_progress") {
    return "doing";
  }
  if (normalized === "待开始") {
    return "todo";
  }
  if (normalized === "进行中") {
    return "doing";
  }
  if (normalized === "阻塞中") {
    return "blocked";
  }
  if (normalized === "已完成") {
    return "done";
  }
  if (["todo", "doing", "blocked", "done"].includes(normalized)) {
    return normalized as TaskStatus;
  }
  return "todo";
}
