const fs = require("node:fs");
const path = require("node:path");
const { listTaskRecords } = require("./lib/task-resolver.ts");

const [taskId, goal, why] = process.argv.slice(2);
if (!taskId || !goal || !why) {
  console.error("Usage: node --experimental-strip-types scripts/ai/create-task.ts <task-id> <goal> <why>");
  process.exit(1);
}
const root = process.cwd();
const templatePath = path.join(root, "tasks", "templates", "task-template.md");
const outputPath = path.join(root, "tasks", "queue", `${taskId}.md`);
const template = fs.readFileSync(templatePath, "utf8");
const suggestedBranch = `codex/${taskId}`;
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
const filled = template
  .replace("# 任务模板", `# 任务 ${taskId}`)
  .replace("## 短编号\n", `## 短编号\n\n${shortId}\n\n`)
  .replace("## 目标\n", `## 目标\n\n${goal}\n\n`)
  .replace("## 为什么\n", `## 为什么\n\n${why}\n\n`)
  .replace("## 父计划\n", "## 父计划\n\n`memory/project/operating-blueprint.md`\n\n")
  .replace("## 计划快照\n", "## 计划快照\n\n待补充：写明本 task 承接的那一小段 plan 边界。\n\n")
  .replace("## 当前模式\n", "## 当前模式\n\n方案评审\n\n")
  .replace("## 分支\n", `## 分支\n\n\`${suggestedBranch}\`\n\n`)
  .replace("## 交付收益\n", "## 交付收益\n\n待补充：说明这次交付完成后的直接收益。\n\n")
  .replace("## 交付风险\n", "## 交付风险\n\n待补充：说明当前最需要防范的发布或回归风险。\n\n")
  .replace("## 一句复盘\n", "## 一句复盘\n\n未复盘\n\n")
  .replace("## 体验验收结果\n", "## 体验验收结果\n\n待验收\n\n")
  .replace("## 测试策略\n", "## 测试策略\n\n待补充：说明为什么要测、测什么、不测什么、为什么当前这样最划算。\n\n")
  .replace("## 主发布版本\n", "## 主发布版本\n\n未生成\n\n")
  .replace("## 关联发布版本\n", "## 关联发布版本\n\n无\n\n")
  .replace("## 状态\n", "## 状态\n\ntodo\n")
  .replace("- 记忆：", "- 记忆：`no change: task created only`")
  .replace("- 索引：", "- 索引：`no change: task created only`")
  .replace("- 路线图：", "- 路线图：`no change: current priority unchanged`")
  .replace("- 文档：", `- 文档：\`tasks/queue/${taskId}.md\``);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, filled);
console.log(outputPath);
