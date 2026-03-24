const fs = require("node:fs");
const path = require("node:path");
const { parseTaskContract, parseTaskMachineFacts } = require(path.join(process.cwd(), "shared", "task-contract.ts"));
const { readCompanion } = require("../coord/lib/task-meta.ts");

const args = process.argv.slice(2);
const taskPath = args.find((arg) => !arg.startsWith("--"));
if (!taskPath) {
  console.error(
    "Usage: node --experimental-strip-types scripts/ai/build-context.ts <task-path> [--include-workflow] [--include-ai-model] [--include-project-memory]"
  );
  process.exit(1);
}

const includeWorkflow = args.includes("--include-workflow");
const includeAiModel = args.includes("--include-ai-model");
const includeProjectMemory = args.includes("--include-project-memory");

const root = process.cwd();
const relTask = taskPath.replace(/^\/+/, "");
const taskId = path.basename(relTask, path.extname(relTask));

function readIfExists(relPath) {
  const absolute = path.join(root, relPath);
  if (!fs.existsSync(absolute)) return "";
  return fs.readFileSync(absolute, "utf8");
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeModuleToken(token) {
  return token.replace(/`/g, "").replace(/\/\*$/, "").trim();
}

function loadFunctionIndex() {
  const absolute = path.join(root, "code_index", "function-index.json");
  if (!fs.existsSync(absolute)) return [];
  return JSON.parse(fs.readFileSync(absolute, "utf8"));
}

function findModuleDocs(relatedModules) {
  return unique(
    relatedModules
      .map((modulePath) => path.join(modulePath, "module.md").replace(/\\/g, "/"))
      .filter((relPath) => fs.existsSync(path.join(root, relPath)))
  );
}

function findRelevantFunctions(relatedModules) {
  const functionIndex = loadFunctionIndex();
  return functionIndex.filter((entry) =>
    relatedModules.some((modulePath) => entry.module.startsWith(modulePath) || entry.file.startsWith(modulePath))
  );
}

function buildKeywords(taskContract, relatedModules) {
  const combined = [
    taskContract.summary,
    taskContract.whyNow,
    taskContract.inScope,
    taskContract.constraints,
    ...relatedModules,
  ]
    .filter(Boolean)
    .join(" ");
  const matches = combined.match(/[\u4e00-\u9fff]{2,}|[A-Za-z][A-Za-z0-9_-]{3,}/g) || [];
  return unique(matches.map((item) => item.toLowerCase())).slice(0, 18);
}

function findRelevantMemoryDocs(keywords, relatedModules) {
  const memoryRoot = path.join(root, "memory");
  if (!fs.existsSync(memoryRoot)) return [];
  const files = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) files.push(full);
    }
  }

  walk(memoryRoot);
  const moduleKeywords = relatedModules
    .flatMap((item) => item.split("/"))
    .map((item) => item.toLowerCase())
    .filter(Boolean);
  const allKeywords = unique([...keywords, ...moduleKeywords]);

  return files
    .map((absolute) => {
      const text = fs.readFileSync(absolute, "utf8").toLowerCase();
      const score = allKeywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0);
      return { rel: path.relative(root, absolute).replace(/\\/g, "/"), score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel))
    .slice(0, 5)
    .map((item) => item.rel);
}

function renderFileSection(relPath) {
  const text = readIfExists(relPath);
  if (!text) return "";
  return `## ${relPath}\n\n${text.slice(0, 8000)}\n`;
}

const taskContent = readIfExists(relTask);
if (!taskContent) {
  console.error(`Task not found: ${relTask}`);
  process.exit(1);
}

const taskContract = parseTaskContract(relTask, taskContent);
const taskMachineFacts = parseTaskMachineFacts(taskContent);
const companion = readCompanion(taskContract.id);
const relatedModules = unique([
  ...taskMachineFacts.relatedModules,
  ...((companion?.planned_files || []).filter((item) => item !== relTask).map(normalizeModuleToken)),
  ...((companion?.planned_modules || []).map(normalizeModuleToken)),
]);
const relevantFunctions = findRelevantFunctions(relatedModules);
const keywords = buildKeywords(taskContract, relatedModules);
const moduleDocs = findModuleDocs(relatedModules);
const memoryDocs = includeProjectMemory ? findRelevantMemoryDocs(keywords, relatedModules) : [];
const codeIndexFiles =
  relatedModules.length > 0 || relevantFunctions.length > 0
    ? ["code_index/module-index.md", "code_index/dependency-map.md"]
    : [];

const baseFiles = [
  "AGENTS.md",
  "memory/project/current-state.md",
  "docs/ARCHITECTURE.md",
  relTask,
];

const optionalFiles = [
  ...(includeWorkflow ? ["docs/DEV_WORKFLOW.md"] : []),
  ...(includeAiModel ? ["docs/AI_OPERATING_MODEL.md"] : []),
  ...(includeProjectMemory
    ? [
        "memory/project/roadmap.md",
        "memory/project/operating-blueprint.md",
        "docs/WORK_MODES.md",
      ]
    : []),
];

const includedFiles = unique([...baseFiles, ...moduleDocs, ...codeIndexFiles, ...optionalFiles, ...memoryDocs]);

let output = "# Context Packet\n\n";
output += `- Task: \`${relTask}\`\n`;
output += `- Related Modules: ${relatedModules.length ? relatedModules.map((item) => `\`${item}\``).join(", ") : "none"}\n`;
output += `- Optional Inputs: ${
  [
    includeWorkflow ? "`workflow`" : "",
    includeAiModel ? "`ai-model`" : "",
    includeProjectMemory ? "`project-memory`" : "",
  ]
    .filter(Boolean)
    .join(", ") || "none"
}\n`;
output += `- Memory Matches: ${memoryDocs.length ? memoryDocs.map((item) => `\`${item}\``).join(", ") : "none"}\n`;
output += `- Function Hits: ${relevantFunctions.length}\n\n`;

output += "## Task Summary\n\n";
output += `- Summary: ${taskContract.summary || "n/a"}\n`;
output += `- Why Now: ${taskContract.whyNow || "n/a"}\n`;
output += `- Boundary: ${taskContract.boundary || "n/a"}\n`;
output += `- Done When: ${taskContract.doneWhen || "n/a"}\n`;
output += `- In Scope: ${taskContract.inScope || "n/a"}\n`;
output += `- Constraints: ${taskContract.constraints || "n/a"}\n\n`;

output += "## Relevant Function Index\n\n";
output += "```json\n";
output += JSON.stringify(relevantFunctions.slice(0, 40), null, 2);
output += "\n```\n\n";

for (const relPath of includedFiles) {
  output += renderFileSection(relPath);
  output += "\n";
}

const outputPath = path.join(root, "output", "ai", "context", `${taskId}.md`);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(outputPath);
