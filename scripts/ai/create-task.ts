const fs = require("node:fs");
const path = require("node:path");
const { listTaskRecords } = require("./lib/task-resolver.ts");
const { ensureCompanion } = require("../coord/lib/task-meta.ts");
const { renderTaskTemplate } = require("./lib/task-template.js");

const [taskId, summary, whyNow] = process.argv.slice(2);
if (!taskId || !summary || !whyNow) {
  console.error("Usage: node --experimental-strip-types scripts/ai/create-task.ts <task-id> <summary> <why-now>");
  process.exit(1);
}

const root = process.cwd();
const outputPath = path.join(root, "tasks", "queue", `${taskId}.md`);
const shortIdMatch = taskId.match(/^task-(\d+)/);
const shortId = shortIdMatch ? `t-${shortIdMatch[1]}` : `t-${taskId}`;
const existingTaskRecords = listTaskRecords(root);
if (existingTaskRecords.some((record) => record.id === taskId || record.path === path.posix.join("tasks/queue", `${taskId}.md`))) {
  console.error(`Task already exists: ${taskId}`);
  process.exit(1);
}
if (existingTaskRecords.some((record) => record.shortId === shortId)) {
  console.error(`Short task id already exists: ${shortId}`);
  process.exit(1);
}

const body = renderTaskTemplate(
  {
    task_id: taskId,
    short_id: shortId,
    summary,
    why_now: whyNow,
  },
  root
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, body);
ensureCompanion(taskId);
console.log(outputPath);
