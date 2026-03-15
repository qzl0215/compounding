import { extractFirstHeading, extractSection, listDocsUnder, readDoc, stripMarkdown } from "@/modules/docs";
import type { TaskCard, TaskGroup, TaskStatus, TaskUpdateTrace } from "./types";

export const TASK_STATUS_ORDER: TaskStatus[] = ["todo", "doing", "blocked", "done"];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "待开始",
  doing: "进行中",
  blocked: "阻塞中",
  done: "已完成",
};

export async function getTaskBoard(): Promise<TaskGroup[]> {
  const taskCards = await listTaskCards();
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
    .map((taskPath, index) => toTaskCard(taskPath, docs[index].content))
    .sort((left, right) => TASK_STATUS_ORDER.indexOf(left.status) - TASK_STATUS_ORDER.indexOf(right.status) || left.path.localeCompare(right.path));
}

function toTaskCard(path: string, content: string): TaskCard {
  return {
    path,
    title: extractFirstHeading(content) ?? path.split("/").pop() ?? path,
    goal: stripMarkdown(extractSection(content, "goal") ?? "当前任务尚未填写目标。"),
    status: normalizeTaskStatus(stripMarkdown(extractSection(content, "status") ?? "todo")),
    relatedModules: parseRelatedModules(content),
    updateTrace: parseUpdateTrace(content),
  };
}

function parseRelatedModules(content: string) {
  const raw = extractSection(content, "related_modules") ?? "";
  const inline = Array.from(raw.matchAll(/`([^`]+)`/g)).map((match) => match[1].trim());
  const bullets = raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^-+\s*/, "").trim())
    .filter(Boolean)
    .map((line) => line.replace(/`/g, ""));
  return Array.from(new Set([...inline, ...bullets]));
}

function parseUpdateTrace(content: string): TaskUpdateTrace {
  const raw = extractSection(content, "update_trace") ?? "";
  return {
    memory: extractTraceValue(raw, "记忆"),
    index: extractTraceValue(raw, "索引"),
    roadmap: extractTraceValue(raw, "路线图"),
    docs: extractTraceValue(raw, "文档"),
  };
}

function extractTraceValue(raw: string, label: string) {
  const line = raw.split(/\r?\n/).find((item) => {
    const normalized = item.trim().replace(/^-\s*/, "");
    return normalized.startsWith(`${label}：`) || normalized.startsWith(`${label}:`);
  });
  if (!line) {
    return "no change: 未记录";
  }
  return line
    .trim()
    .replace(/^-\s*/, "")
    .split(/[:：]/)
    .slice(1)
    .join(":")
    .replace(/`/g, "")
    .trim();
}

function normalizeTaskStatus(value: string): TaskStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === "in_progress") {
    return "doing";
  }
  if (TASK_STATUS_ORDER.includes(normalized as TaskStatus)) {
    return normalized as TaskStatus;
  }
  return "todo";
}
