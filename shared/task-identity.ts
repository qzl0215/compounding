const TASK_QUEUE_PREFIX = "tasks/queue/";

export function normalizeTaskReference(input: string): string {
  const normalized = String(input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "");

  if (!normalized) {
    return "";
  }

  const withoutPrefix = normalized.startsWith(TASK_QUEUE_PREFIX) ? normalized.slice(TASK_QUEUE_PREFIX.length) : normalized;
  const basename = withoutPrefix.split("/").pop() || withoutPrefix;
  return basename.replace(/\.md$/, "").trim();
}

export function taskIdFromPath(taskPath: string): string {
  return normalizeTaskReference(taskPath);
}

export function taskSequence(value: string): string {
  const match = normalizeTaskReference(value).match(/(?:task-|t-)(\d+)/);
  return match?.[1] || "";
}

export function deriveShortId(taskId: string): string {
  const sequence = taskSequence(taskId);
  return sequence ? `t-${sequence}` : normalizeTaskReference(taskId);
}

export function matchesTaskReference(taskId: string, shortId: string, input: string): boolean {
  const normalized = normalizeTaskReference(input);
  if (!normalized) {
    return false;
  }

  return normalized === taskId || normalized === shortId || (Boolean(taskSequence(taskId)) && taskSequence(taskId) === taskSequence(normalized));
}
