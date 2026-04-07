const TASK_QUEUE_PREFIX = "tasks/queue/";

export type TaskIdentityRecord = {
  id: string;
  shortId: string;
  path: string;
};

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

export function isValidShortId(value: string): boolean {
  return /^t-\d{3}$/.test(normalizeTaskReference(value));
}

export function matchesTaskReference(taskId: string, shortId: string, input: string): boolean {
  const normalized = normalizeTaskReference(input);
  if (!normalized) {
    return false;
  }

  return normalized === normalizeTaskReference(taskId) || normalized === normalizeTaskReference(shortId);
}

export function collectTaskIdentityErrors(records: TaskIdentityRecord[]): string[] {
  const seenTaskIds = new Map<string, string>();
  const seenShortIds = new Map<string, string>();
  const errors: string[] = [];

  for (const record of records) {
    const taskId = normalizeTaskReference(record.id);
    const shortId = normalizeTaskReference(record.shortId);
    const path = record.path;

    if (!taskId) {
      errors.push(`${path}: task id 为空。`);
      continue;
    }

    if (!shortId) {
      errors.push(`${path}: 缺少短编号。`);
    } else if (!isValidShortId(shortId)) {
      errors.push(`${path}: 短编号 ${shortId} 不符合 t-xxx 规范。`);
    }

    const existingTaskPath = seenTaskIds.get(taskId);
    if (existingTaskPath) {
      errors.push(`${path}: task id ${taskId} 与 ${existingTaskPath} 重复。`);
    } else {
      seenTaskIds.set(taskId, path);
    }

    if (shortId) {
      const existingShortPath = seenShortIds.get(shortId);
      if (existingShortPath) {
        errors.push(`${path}: 短编号 ${shortId} 与 ${existingShortPath} 重复。`);
      } else {
        seenShortIds.set(shortId, path);
      }
    }
  }

  return errors;
}

export function assertUniqueTaskIdentities(records: TaskIdentityRecord[]): void {
  const errors = collectTaskIdentityErrors(records);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}
