import { extractFirstHeading, extractSection, stripMarkdown } from "@/modules/docs";
import type { TaskCard, TaskUpdateTrace, TaskStatus } from "./types";

export function parseTaskCard(path: string, content: string): Omit<TaskCard, "git"> {
  const id = taskIdFromPath(path);
  return {
    id,
    path,
    shortId: stripMarkdown(extractSection(content, "short_id") ?? deriveShortId(id)),
    title: extractFirstHeading(content) ?? path.split("/").pop() ?? path,
    goal: stripMarkdown(extractSection(content, "goal") ?? "当前任务尚未填写目标。"),
    status: normalizeTaskStatus(stripMarkdown(extractSection(content, "status") ?? "todo")),
    currentMode: stripMarkdown(extractSection(content, "current_mode") ?? ""),
    branch: stripMarkdown(extractSection(content, "branch") ?? ""),
    recentCommit: stripMarkdown(extractSection(content, "recent_commit") ?? ""),
    deliveryBenefit: stripMarkdown(extractSection(content, "delivery_benefit") ?? extractSection(content, "goal") ?? ""),
    deliveryRisk: stripMarkdown(extractSection(content, "delivery_risk") ?? extractSection(content, "risks") ?? ""),
    deliveryRetro: stripMarkdown(extractSection(content, "delivery_retro") ?? extractSection(content, "retrospective") ?? "未复盘"),
    primaryRelease: stripMarkdown(extractSection(content, "primary_release") ?? "未生成"),
    linkedReleases: parseLinkedReleases(content),
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

function parseLinkedReleases(content: string) {
  const raw = extractSection(content, "linked_releases") ?? "";
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^-\s*/, "").replace(/`/g, "").trim())
    .filter(Boolean)
    .filter((value) => value !== "无");
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

function taskIdFromPath(path: string) {
  return path.split("/").pop()?.replace(/\.md$/, "") ?? path;
}

function deriveShortId(taskId: string) {
  const match = taskId.match(/^task-(\d+)/);
  return match ? `t-${match[1]}` : taskId;
}
