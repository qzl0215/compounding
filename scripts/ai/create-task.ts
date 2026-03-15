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
  .replace("# 任务模板", `# 任务 ${taskId}`)
  .replace("## 目标\n", `## 目标\n\n${goal}\n\n`)
  .replace("## 为什么\n", `## 为什么\n\n${why}\n\n`)
  .replace("## 状态\n", "## 状态\n\n todo\n");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, filled);
console.log(outputPath);
