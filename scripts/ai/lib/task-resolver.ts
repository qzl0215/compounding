const fs = require("node:fs");
const path = require("node:path");
const {
  assertUniqueTaskIdentities,
  matchesTaskReference,
  normalizeTaskReference,
  taskIdFromPath,
} = require(path.join(detectWorkspaceRoot(), "shared", "task-identity.ts"));
const { parseTaskContract } = require(path.join(detectWorkspaceRoot(), "shared", "task-contract.ts"));

function detectWorkspaceRoot(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(currentDir, "shared", "task-contract.ts")) && fs.existsSync(path.join(currentDir, "tasks", "queue"))) {
      return currentDir;
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      return path.resolve(startDir);
    }
    currentDir = parentDir;
  }
}

function taskQueueDir(root = process.cwd()) {
  return path.join(root, "tasks", "queue");
}

function listTaskRecords(root = process.cwd()) {
  const records = fs
    .readdirSync(taskQueueDir(root))
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const relativePath = path.posix.join("tasks/queue", name);
      const content = fs.readFileSync(path.join(root, relativePath), "utf8");
      const parsed = parseTaskContract(relativePath, content);
      return {
        id: taskIdFromPath(relativePath),
        shortId: parsed.shortId,
        path: relativePath,
        title: parsed.title,
      };
    });
  assertUniqueTaskIdentities(records);
  return records;
}

function resolveTaskRecord(taskLike, root = process.cwd()) {
  const normalized = normalizeTaskReference(taskLike);
  if (!normalized) {
    return null;
  }

  return (
    listTaskRecords(root).find((record) => matchesTaskReference(record.id, record.shortId, normalized) || record.path === taskLike) || null
  );
}

function resolveTaskId(taskLike, root = process.cwd()) {
  return resolveTaskRecord(taskLike, root)?.id || null;
}

function resolveTaskIds(taskLikes, root = process.cwd()) {
  return Array.from(
    new Set(
      (taskLikes || [])
        .map((taskLike) => resolveTaskId(taskLike, root))
        .filter(Boolean)
    )
  );
}

module.exports = {
  listTaskRecords,
  resolveTaskId,
  resolveTaskIds,
  resolveTaskRecord,
  taskQueueDir,
};
