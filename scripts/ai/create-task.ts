const fs = require("node:fs");
const path = require("node:path");

const [taskId, goal, why] = process.argv.slice(2);
if (!taskId || !goal || !why) {
  console.error("Usage: node --experimental-strip-types scripts/ai/create-task.ts <task-id> <goal> <why>");
  process.exit(1);
}
const root = process.cwd();
const templatePath = path.join(root, "tasks", "templates", "task-template.md");
const outputPath = path.join(root, "tasks", "queue", `${taskId}.md`);
const template = fs.readFileSync(templatePath, "utf8");
const filled = template
  .replace("# Task ID", `# ${taskId}`)
  .replace("## Goal\n", `## Goal\n\n${goal}\n\n`)
  .replace("## Why\n", `## Why\n\n${why}\n\n`)
  .replace("## Status\n", `## Status\n\n todo\n`);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, filled);
console.log(outputPath);
