const fs = require("node:fs");
const path = require("node:path");
const { listTaskRecords } = require("./lib/task-resolver.ts");
const { ensureCompanion } = require("../coord/lib/task-meta.ts");

const argv = process.argv.slice(2);
const [taskId, summary, whyNow, ...rest] = argv;
const options = Object.fromEntries(
  rest
    .filter((arg) => arg.startsWith("--"))
    .map((arg) => {
      const [key, value] = arg.slice(2).split("=");
      return [key, value ?? ""];
    })
);
if (!taskId || !summary || !whyNow) {
  console.error(
    "Usage: node --experimental-strip-types scripts/ai/create-task.ts <task-id> <summary> <why-now> [--boundary=...] [--doneWhen=...] [--outOfScope=...] [--constraints=...]"
  );
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

const boundary = options.boundary || "待补充：写明这个 task 从 plan 承接的那一段清晰边界；若价值判断、范围外或 taste decision 仍未收口，请先回到 plan。";
const doneWhen =
  options.doneWhen || "待补充：写明体验级交付结果，而不是实现动作；若仍是实现动作，说明决策未收口。";
const outOfScope = options.outOfScope || "- 待补充：列出这次明确不做的事项。";
const constraints =
  options.constraints || "- 待补充：列出必须遵守的边界、依赖和冻结项；仍需人判断的只允许是价值判断、体验取舍或最终验收。";

const body = `# 任务 ${taskId}

## 任务摘要

- 短编号：\`${shortId}\`
- 父计划：\`memory/project/operating-blueprint.md\`
- 任务摘要：
  ${summary}
- 为什么现在：
  ${whyNow}
- 承接边界：
  ${boundary}
- 完成定义：
  ${doneWhen}

## 执行合同

### 要做

- 待补充：列出这次明确要做的事项。

### 不做

${outOfScope}

### 约束

${constraints}

### 关键风险

- 待补充：说明最大的回归或发布风险。

### 测试策略

- 为什么测：待补充。
- 测什么：待补充。
- 不测什么：待补充。
- 当前最小集理由：待补充。

## 交付结果

- 状态：todo
- 体验验收结果：
  待验收
- 交付结果：
  未交付
- 复盘：
  未复盘
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, body);
ensureCompanion(taskId);
console.log(outputPath);
