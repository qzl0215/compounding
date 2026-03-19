const fs = require("node:fs");
const path = require("node:path");
const { extractSection, stripMarkdown } = require("./markdown-sections.ts");
const {
  deriveShortId,
  matchesTaskReference,
  normalizeTaskReference,
  taskIdFromPath,
} = require(path.join(process.cwd(), "shared", "task-identity.ts"));

function taskQueueDir(root = process.cwd()) {
  return path.join(root, "tasks", "queue");
}

function listTaskRecords(root = process.cwd()) {
  return fs
    .readdirSync(taskQueueDir(root))
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => {
      const relativePath = path.posix.join("tasks/queue", name);
      const content = fs.readFileSync(path.join(root, relativePath), "utf8");
      const id = taskIdFromPath(relativePath);
      const shortId = stripMarkdown(extractSection(content, "short_id", root) || deriveShortId(id));
      const titleMatch = content.match(/^#\s+(.+)$/m);
      return {
        id,
        shortId,
        path: relativePath,
        title: titleMatch ? titleMatch[1].trim() : id,
      };
    });
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
